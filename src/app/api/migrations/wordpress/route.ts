import { NextRequest, NextResponse } from 'next/server';

interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  pubDate: string;
  creator?: string;
  category: string[];
  tags: string[];
  comments: WordPressComment[];
  images: string[];
}

interface WordPressComment {
  author: string;
  authorEmail: string;
  authorUrl?: string;
  pubDate: string;
  content: string;
  approved: boolean;
}

function parseXmlContent(xmlString: string): WordPressPost[] {
  const posts: WordPressPost[] = [];

  // Extract items from XML
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemContent = match[1];

    // Helper to extract text from XML tags with CDATA support
    const extractText = (content: string, tagName: string): string => {
      const regex = new RegExp(`<${tagName}(?:[^>]*?)>([\\s\\S]*?)</${tagName}>`, 'i');
      const result = regex.exec(content);
      if (!result) return '';

      let text = result[1];
      // Handle CDATA
      if (text.includes('<![CDATA[')) {
        text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
      }
      return text.trim();
    };

    const title = extractText(itemContent, 'title');
    const content = extractText(itemContent, 'content:encoded');
    const excerpt = extractText(itemContent, 'excerpt:encoded');
    const pubDate = extractText(itemContent, 'pubDate');
    const creator = extractText(itemContent, 'dc:creator');

    // Extract categories
    const categories: string[] = [];
    const categoryRegex = /<category[^>]*domain="category"[^>]*>([^<]+)<\/category>/g;
    let catMatch;
    while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
      categories.push(catMatch[1]);
    }

    // Extract tags
    const tags: string[] = [];
    const tagRegex = /<category[^>]*domain="post_tag"[^>]*>([^<]+)<\/category>/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(itemContent)) !== null) {
      tags.push(tagMatch[1]);
    }

    // Extract comments
    const comments: WordPressComment[] = [];
    const commentRegex = /<wp:comment>([\s\S]*?)<\/wp:comment>/g;
    let commentMatch;
    while ((commentMatch = commentRegex.exec(itemContent)) !== null) {
      const commentContent = commentMatch[1];
      const commentAuthor = extractText(commentContent, 'wp:comment_author');
      const commentAuthorEmail = extractText(commentContent, 'wp:comment_author_email');
      const commentAuthorUrl = extractText(commentContent, 'wp:comment_author_url');
      const commentPubDate = extractText(commentContent, 'wp:comment_date');
      const commentText = extractText(commentContent, 'wp:comment_content');
      const approvedStr = extractText(commentContent, 'wp:comment_approved');

      if (commentAuthor && commentText) {
        comments.push({
          author: commentAuthor,
          authorEmail: commentAuthorEmail,
          authorUrl: commentAuthorUrl || undefined,
          pubDate: commentPubDate,
          content: commentText,
          approved: approvedStr === '1',
        });
      }
    }

    // Extract images from content
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      images.push(imgMatch[1]);
    }

    if (title && (content || excerpt)) {
      posts.push({
        title,
        content: content || excerpt || '',
        excerpt: excerpt || undefined,
        pubDate,
        creator: creator || undefined,
        category: categories,
        tags,
        comments,
        images,
      });
    }
  }

  return posts;
}

function parseJsonContent(jsonString: string): WordPressPost[] {
  try {
    const data = JSON.parse(jsonString);
    const posts = Array.isArray(data) ? data : data.posts || [];

    return posts.map((post: any) => ({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt,
      pubDate: post.pubDate || post.date || new Date().toISOString(),
      creator: post.creator || post.author,
      category: Array.isArray(post.category) ? post.category : (post.category ? [post.category] : []),
      tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []),
      comments: post.comments || [],
      images: post.images || [],
    })).filter((post: WordPressPost) => post.title && post.content);
  } catch (error) {
    console.error('JSON parse error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const isJson = file.name.endsWith('.json');

    let posts: WordPressPost[];
    if (isJson) {
      posts = parseJsonContent(fileContent);
    } else {
      posts = parseXmlContent(fileContent);
    }

    // Get config options
    const importConfig = {
      importCategories: formData.get('importCategories') === 'true',
      importTags: formData.get('importTags') === 'true',
      importAuthors: formData.get('importAuthors') === 'true',
      importDates: formData.get('importDates') === 'true',
      importComments: formData.get('importComments') === 'true',
      importImages: formData.get('importImages') === 'true',
      importSlugs: formData.get('importSlugs') === 'true',
    };

    // Process posts with config
    let processedCount = 0;
    for (const post of posts) {
      try {
        // Here you would typically save to database
        // For now, just validate
        if (!post.title || !post.content) continue;

        // Apply config filters
        if (!importConfig.importCategories) post.category = [];
        if (!importConfig.importTags) post.tags = [];
        if (!importConfig.importAuthors) post.creator = undefined;
        if (!importConfig.importComments) post.comments = [];
        if (!importConfig.importImages) post.images = [];

        processedCount++;
      } catch (err) {
        console.error(`Failed to process post: ${post.title}`, err);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      total: posts.length,
      processed: processedCount,
      message: `Successfully processed ${processedCount} of ${posts.length} posts`,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
