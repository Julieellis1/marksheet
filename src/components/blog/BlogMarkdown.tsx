import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function isExternalHref(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (/^https?:\/\//i.test(href)) return true;
  return false;
}

/**
 * Shared markdown renderer for blog bodies.
 * Guarantees: **bold**, *italic*, [links](url) and ![images](url) render,
 * and every body image is fully responsive (max-width:100%, height:auto,
 * full-width within the article column, lazy-loaded).
 */
export function BlogMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a(props) {
          const href = typeof props.href === "string" ? props.href : "";
          const external = isExternalHref(href);
          return (
            <a
              href={href || undefined}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {props.children}
            </a>
          );
        },
        img(props) {
          const src = typeof props.src === "string" ? props.src : "";
          if (!src) return null;
          const alt = typeof props.alt === "string" ? props.alt : "";
          const title = typeof props.title === "string" ? props.title : undefined;
          const image = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              title={title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="block h-auto w-full rounded-lg object-cover"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          );
          if (title) {
            return (
              <figure className="max-w-full">
                {image}
                <figcaption>{title}</figcaption>
              </figure>
            );
          }
          return image;
        },
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
