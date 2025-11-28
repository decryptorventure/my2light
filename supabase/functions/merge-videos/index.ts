import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Verify user authentication
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const { segmentIds } = await req.json()

        if (!segmentIds || !Array.isArray(segmentIds) || segmentIds.length === 0) {
            throw new Error('Invalid segment IDs')
        }

        // Fetch segment data
        const { data: segments, error: fetchError } = await supabaseClient
            .from('video_segments')
            .select('*')
            .in('id', segmentIds)
            .eq('user_id', user.id)
            .order('start_time', { ascending: true })

        if (fetchError || !segments || segments.length === 0) {
            throw new Error('Failed to fetch segments')
        }

        // Create processing job
        const { data: job, error: jobError } = await supabaseClient
            .from('video_processing_jobs')
            .insert({
                user_id: user.id,
                segment_ids: segmentIds,
                status: 'pending'
            })
            .select()
            .single()

        if (jobError) {
            throw new Error('Failed to create processing job')
        }

        // Update job status to processing
        await supabaseClient
            .from('video_processing_jobs')
            .update({ status: 'processing' })
            .eq('id', job.id)

        // Download video segments
        const videoBlobs: Blob[] = []
        for (const segment of segments) {
            if (!segment.video_url) continue

            const response = await fetch(segment.video_url)
            if (response.ok) {
                videoBlobs.push(await response.blob())
            }
        }

        if (videoBlobs.length === 0) {
            throw new Error('No valid video segments found')
        }

        // Simple concatenation for WebM videos
        // NOTE: This is a basic implementation. For production, use FFmpeg or video processing service
        const mergedBlob = new Blob(videoBlobs, { type: 'video/webm' })

        // Upload merged video to storage
        const fileName = `merged/${user.id}/${job.id}.webm`
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('videos')
            .upload(fileName, mergedBlob, {
                contentType: 'video/webm',
                upsert: false
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('videos')
            .getPublicUrl(fileName)

        // Update job with output URL
        await supabaseClient
            .from('video_processing_jobs')
            .update({
                status: 'completed',
                output_url: publicUrl,
                completed_at: new Date().toISOString()
            })
            .eq('id', job.id)

        // Create notification
        await supabaseClient
            .from('notifications')
            .insert({
                user_id: user.id,
                type: 'video_ready',
                title: 'Video đã sẵn sàng! 🎥',
                message: 'Video highlight của bạn đã được xử lý xong',
                data: { job_id: job.id, video_url: publicUrl }
            })

        return new Response(
            JSON.stringify({
                success: true,
                jobId: job.id,
                videoUrl: publicUrl
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
