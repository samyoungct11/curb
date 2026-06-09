type Props = {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
  iconOnly?: boolean
}

const sizes = { sm: 32, md: 44, lg: 60 }

export function CurbLogo({ size = 'md', dark = false, iconOnly = false }: Props) {
  const px = sizes[size]
  return (
    <div className="flex items-center" style={{ gap: px * 0.25 }}>
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: px,
          height: px,
          background: dark ? '#3A9E6A' : '#2A7D52',
          borderRadius: px * 0.23,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: px * 0.55,
            color: '#fff',
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
      {!iconOnly && (
        <span
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: px * 0.68,
            letterSpacing: '-0.5px',
            color: dark ? '#F0F2EF' : '#141714',
            lineHeight: 1,
          }}
        >
          Curb<span style={{ color: dark ? '#6DCCA0' : '#2A7D52' }}>.</span>
        </span>
      )}
    </div>
  )
}
