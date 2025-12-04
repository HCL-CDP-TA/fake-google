"use client"

import React from "react"

export function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

interface SmartLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

export const SmartLink: React.FC<SmartLinkProps> = ({ href, children, ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isInIframe()) {
      e.preventDefault()
      window.parent.postMessage({ type: "open-url", url: href }, "*")
    }
    if (props.onClick) props.onClick(e)
  }

  return (
    <a href={isInIframe() ? "#" : href} {...props} onClick={handleClick}>
      {children}
    </a>
  )
}
