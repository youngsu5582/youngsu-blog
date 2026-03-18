import { ImageResponse } from "next/og";
import { getPostBySlug, getAllPosts, getUrlSlug } from "@/lib/content";

export const alt = "Post thumbnail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: getUrlSlug(post.slug),
  }));
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title || "포스트";
  const categories = post?.categories || [];
  const date = post ? new Date(post.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #e8f4fd 0%, #d0e8f7 30%, #b8d9f0 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: Categories */}
        <div style={{ display: "flex", gap: "12px" }}>
          {categories.slice(0, 3).map((cat) => (
            <div
              key={cat}
              style={{
                fontSize: "20px",
                color: "#2980b9",
                padding: "6px 16px",
                borderRadius: "20px",
                background: "rgba(41, 128, 185, 0.12)",
                border: "1px solid rgba(41, 128, 185, 0.2)",
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Center: Title */}
        <div
          style={{
            fontSize: title.length > 40 ? "42px" : "52px",
            fontWeight: 700,
            color: "#1a365d",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            maxWidth: "90%",
          }}
        >
          {title}
        </div>

        {/* Bottom: Author + Date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Avatar circle */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #3498db, #2980b9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              영
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 600, color: "#2c3e50" }}>
                이영수
              </span>
              <span style={{ fontSize: "16px", color: "#7f8c8d" }}>
                {date}
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: "18px",
              color: "#95a5a6",
              letterSpacing: "0.05em",
            }}
          >
            youngsu5582.today
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
