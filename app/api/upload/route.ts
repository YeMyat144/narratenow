import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image")

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Create a new FormData instance for the Imgur API
    const imgurFormData = new FormData()
    imgurFormData.append("image", image)

    // Make the request to Imgur
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID}`,
      },
      body: imgurFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Imgur API error:", errorData)
      return NextResponse.json(
        { error: "Failed to upload image to Imgur", details: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in upload route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
