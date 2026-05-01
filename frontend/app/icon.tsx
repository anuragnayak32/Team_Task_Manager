import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/** Default favicon (app root and project list). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0f766e 0%, #1d4ed8 100%)',
          color: 'white',
          fontSize: 17,
          fontWeight: 700,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        T
      </div>
    ),
    { ...size }
  )
}
