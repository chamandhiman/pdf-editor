# PDF Studio Pro

Build a modern, premium PDF Editor web application UI called PDF Studio.

IMPORTANT:
This is the FIRST UI/design phase.

Do NOT implement real PDF processing yet.
Do NOT use PDF.js, pdf-lib, Firebase, Supabase, Cloudflare APIs, OCR, AI, payments, or backend services.

I will add the real PDF engine later after downloading this project and running it locally.

The goal of this prompt is to create the complete professional PDF editor workspace UI and visual foundation.

Use:

React

TypeScript

Tailwind CSS

shadcn/ui

Lucide icons

Keep the code modular and clean so the UI can later be connected to PDF.js and pdf-lib.

==================================================
PRODUCT STYLE

Create a serious commercial PDF editor.

Design inspiration can come from:

Adobe Acrobat web

PDF House

PDF.ai

Smallpdf

Sejda

BUT DO NOT COPY their exact design, branding, logos, colors, or layouts.

Create an original design.

Visual style:

premium

clean

minimal

productivity-focused

professional SaaS

light theme

subtle borders

subtle shadows

neutral application background

white PDF page

restrained accent color

compact toolbar

excellent spacing

Do NOT use excessive gradients, glassmorphism, neon effects, or oversized rounded cards.

The PDF document should look like a real A4 document.

==================================================
APPLICATION FLOW

Create two main screens:

Upload / Start screen

PDF Editor workspace

The application should initially show the Upload screen.

After selecting the demo PDF, transition to the Editor workspace.

For now, use a realistic built-in demo document instead of real PDF processing.

==================================================
UPLOAD SCREEN

Create a polished landing/upload experience.

Header:

Left:
PDF Studio logo

Navigation:

Tools
Features
Pricing
Resources

Right:

Sign In
Get Started

Hero:

Heading:

"Edit PDFs. Simply."

Description:

"Edit, annotate, sign and manage your PDF documents from one powerful workspace."

Large upload area:

"Drop your PDF here"

"or click to browse"

Button:

"Choose PDF"

Supporting text:

"PDF files up to 100 MB"

Security message:

"Your files stay private and secure."

The upload card should have:

drag hover state

border

upload icon

polished empty state

Since this is only a UI prototype, clicking Choose PDF may open a basic file picker and then load the demo editor interface.

==================================================
EDITOR APPLICATION SHELL

Create a full-screen PDF editing application.

This should feel like a dedicated desktop application inside the browser, NOT like a normal website dashboard.

Overall structure:

TOP HEADER

Left:

PDF Studio logo

File name:

"Sample-Document.pdf"

Dropdown arrow

Center:

Undo
Redo

Right:

Save
Share
Download
More

Also show:

Sign In

MAIN TOOLBAR

Create a professional toolbar below the header.

Tools:

Select
Hand
Add Text
Edit Text
Sign
Draw
Highlight
Image
Stamp
Link
Note

Use Lucide icons.

Each tool should have:

icon

label where appropriate

tooltip

hover state

active state

Keep toolbar compact.

==================================================
LEFT SIDEBAR

Create a collapsible left sidebar.

Tabs:

Thumbnails
Outline
Annotations
Bookmarks

Default:

Thumbnails

Show realistic page thumbnails:

Page 1
Page 2
Page 3
Page 4

Each thumbnail should:

look like a miniature document

show page number

have hover state

have selected state

At the bottom:

Add Page

Import Pages

Create a three-dot menu on thumbnail hover.

Menu:

Rotate Clockwise
Rotate Counter-clockwise
Duplicate
Delete

These are UI-only for now.

==================================================
MAIN PDF WORKSPACE

Create the central PDF canvas.

Application background should be a soft neutral gray.

Place a large white A4 document in the center.

Show realistic demo content.

Page 1 title:

EMPLOYEE SERVICE AGREEMENT

Include:

Company information
Employee information
Agreement date
Sections
Paragraphs
Signature area

Create multiple pages vertically so the editor looks like a real PDF document viewer.

Show:

Page 1
Page 2
Page 3
Page 4

Each page should have realistic text, headings, spacing and tables.

Do NOT make the PDF content look like a generic wireframe.

It should visually resemble an actual professional document.

==================================================
RIGHT PROPERTIES PANEL

Create a right-side properties panel.

Default state:

DOCUMENT

Show:

Page Size
A4

Pages
4

Zoom
100%

Orientation
Portrait

When an object is selected, the panel can switch to object properties.

Create the visual structure now even if functionality is mocked.

For Text:

TEXT

Font
Inter

Font Size
16

Bold
Italic
Underline

Text Color

Alignment

Left
Center
Right

Opacity

Position:

X
Y

Size:

Width
Height

==================================================
BOTTOM STATUS BAR

Create a subtle bottom bar.

Left:

Page 1 of 4

Center:

Zoom controls

100% +

Fit Width
Fit Page

Right:

Single Page
Continuous
Fullscreen

==================================================
RESPONSIVE FOUNDATION

Desktop:

Left thumbnail sidebar
Center PDF workspace
Right properties panel

Tablet:

Allow sidebars to collapse.

Mobile:

Do not squeeze the desktop interface.

Prepare the structure for:

slide-out thumbnails

slide-out properties

horizontal bottom toolbar

==================================================
COMPONENT ARCHITECTURE

Keep components modular.

Suggested structure:

components/
editor/
EditorHeader
EditorToolbar
ThumbnailSidebar
ThumbnailItem
PdfWorkspace
PdfPage
PropertiesPanel
BottomToolbar

pages/
UploadPage
EditorPage

Create reusable UI components.

Create TypeScript interfaces for:

PDFDocument
PDFPage
PDFObject

Keep editor state separate from presentation components.

==================================================
IMPORTANT

Do NOT spend effort on backend functionality.

Do NOT implement actual PDF parsing.

Do NOT implement actual PDF editing.

Do NOT implement authentication.

Do NOT implement conversion.

Do NOT implement Firebase.

Do NOT implement Cloudflare.

Focus on producing a beautiful, professional, realistic PDF editor interface.

The final result should look like the UI of a real commercial PDF editing application and should be ready for a second development pass.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vista-doc-ui.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8e9206ed-0aa6-4d97-938e-6cf66b77c635).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
