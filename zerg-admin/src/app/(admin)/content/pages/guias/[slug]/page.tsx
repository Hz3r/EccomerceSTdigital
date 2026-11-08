"use client"

import { useParams } from "next/navigation"
import { PageEditor } from "@/components/pages/page-editor"

export default function GuideEditor() {
  const { slug } = useParams<{ slug: string }>()
  return <PageEditor key={slug} slug={slug} kind="guide" />
}
