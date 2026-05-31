import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const body = (await request.json()) as HandleUploadBody
      const response = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          // Add authentication here before exposing uploads to untrusted public traffic.
          if (!pathname.toLowerCase().endsWith('.glb')) {
            throw new Error('Only .glb character models can be uploaded.')
          }

          return {
            allowedContentTypes: ['model/gltf-binary', 'application/octet-stream'],
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: true,
          }
        },
        onUploadCompleted: async () => {
          // Character metadata is stored in the browser for this MVP.
        },
      })

      return Response.json(response)
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Upload failed.' },
        { status: 400 },
      )
    }
  },
}
