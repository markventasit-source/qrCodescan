# SEO & Favicon Setup Guide

Your QR Tracker project now has comprehensive favicon and metadata support for optimal social sharing and branding!

## What Was Added

### 1. Favicons & Icons
- ✅ `/app/favicon.ico` - Classic favicon (auto-detected by Next.js)
- ✅ `/public/icon.svg` - Modern SVG icon (scalable, sharp on all devices)
- ✅ Custom QR code design with green accent colors matching your brand

### 2. Social Media Images
- ✅ `/public/og-image.png` - Open Graph image (1200x630px)
  - Displays when sharing on Facebook, LinkedIn, Twitter, Slack, etc.
  - Professional branded design with QR code visual

### 3. Metadata & SEO
Updated `/app/layout.tsx` with:
- ✅ Dynamic page titles with template
- ✅ Rich descriptions and keywords
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ Search engine directives (robots meta)
- ✅ Structured icon configuration

### 4. PWA Support
- ✅ `/public/manifest.json` - Web app manifest
  - Enables "Add to Home Screen" on mobile
  - Defines app name, colors, and icons
  - Includes dashboard shortcut

### 5. SEO Configuration
- ✅ `/public/robots.txt` - Search engine crawler rules
  - Allows indexing of public pages
  - Blocks QR redirect routes from search results

## Required Configuration

### Update Your Production URL

1. **In your .env file**, set your production domain:
   ```bash
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **In robots.txt**, update the sitemap URL:
   ```
   Sitemap: https://yourdomain.com/sitemap.xml
   ```

### Deploy and Test

After deploying to your live site:

1. **Test Open Graph Preview:**
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

2. **Test Favicon:**
   - Check browser tab icon
   - Check bookmarks icon
   - Test on mobile (add to home screen)

3. **Verify Metadata:**
   - View page source
   - Check that all meta tags are present
   - Confirm image URLs are absolute

## How It Works

### Favicon Hierarchy
Next.js automatically serves:
1. `/app/favicon.ico` for older browsers
2. `/public/icon.svg` for modern browsers (referenced in metadata)

### Open Graph Images
When you share a link:
- Social platforms request `/og-image.png`
- Your custom branded image appears in the preview
- No additional configuration needed!

### Dynamic Metadata
The `metadataBase` in layout.tsx ensures:
- All relative URLs become absolute
- Images work correctly in social previews
- Different environments (dev/prod) are handled automatically

## Customization

### Change Colors
Edit the SVG files to match your brand:
- `#10b981` - Primary green
- `#1f2937` - Dark background
- `#ffffff` - White accents

### Update Social Copy
In `app/layout.tsx`, modify:
- `description` - Text shown in link previews
- `keywords` - SEO keywords
- `openGraph.title` - Social media title

### Twitter Handle
Update the Twitter creator handle:
```typescript
twitter: {
  creator: "@yourhandle",
}
```

## Testing Locally

To preview social sharing locally:
1. Use ngrok to create a public URL: `ngrok http 3000`
2. Set `NEXT_PUBLIC_APP_URL` to your ngrok URL
3. Test in social media debuggers

## Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Update `robots.txt` sitemap URL
- [ ] Deploy all files
- [ ] Test Open Graph preview
- [ ] Verify favicon displays correctly
- [ ] Check mobile "Add to Home Screen"
- [ ] Test share link on social platforms

## Need More?

Consider adding:
- Sitemap.xml generation for better SEO
- Structured data (JSON-LD) for rich snippets
- Additional social platform meta tags (Pinterest, WhatsApp)
- Custom 404 and error page metadata
