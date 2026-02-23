"use client"
import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type Props = ImageProps & { fallbackSrc?: string }

export default function ImageWithFallback({ src, alt, fallbackSrc = '/media/placeholder.svg', ...rest }: Props) {
  const [failed, setFailed] = useState(false)
  const resolved = (!src || failed) ? fallbackSrc : src
  return (
    <Image
      {...rest}
      alt={alt}
      src={resolved}
      onError={() => setFailed(true)}
    />
  )
}

