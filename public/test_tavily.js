async function test() {
  const url = "https://www.linkedin.com/posts/jakezward_were-hiring-an-seo-strategist-at-contact-ugcPost-7473649727276941313-eLoP/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAClj6n8Bo0GpuXFWQ9oRR9eQfPqW9ta5l5M";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });
    const html = await res.text();
    
    console.log("Dumping all meta tags:");
    const metaRegex = /<meta[^>]*>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      console.log("  ", match[0]);
    }
    
    // Let's search if the phrase "Excited about the future of search" exists in the body
    const query = "Excited about the future of search";
    const index = html.indexOf(query);
    console.log(`\nIndex of query "${query}":`, index);
    if (index !== -1) {
      console.log("\nContext around query:");
      console.log(html.slice(Math.max(0, index - 200), Math.min(html.length, index + 300)));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
