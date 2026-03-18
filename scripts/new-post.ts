/**
 * 새 포스트 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/new-post.ts "포스트 제목"
 *   npx tsx scripts/new-post.ts "포스트 제목" --category 프로그래밍
 *   npx tsx scripts/new-post.ts "포스트 제목" --tags "java,spring"
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const title = args.find((a) => !a.startsWith("--"));

if (!title) {
  console.error("사용법: npx tsx scripts/new-post.ts \"포스트 제목\"");
  process.exit(1);
}

// Parse flags
const categoryIdx = args.indexOf("--category");
const category = categoryIdx !== -1 ? args[categoryIdx + 1] : "";
const tagsIdx = args.indexOf("--tags");
const tags = tagsIdx !== -1 ? args[tagsIdx + 1].split(",").map((t) => t.trim()) : [];

// Generate slug from title
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9가-힣\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

const today = new Date().toISOString().split("T")[0];
const filePath = path.resolve(__dirname, `../content/posts/${slug}.mdx`);

if (fs.existsSync(filePath)) {
  console.error(`❌ 이미 존재하는 파일: ${slug}.mdx`);
  process.exit(1);
}

const frontmatter = `---
title: ${title}
date: ${today}
description:
categories:${category ? `\n  - ${category}` : " []"}
tags:${tags.length > 0 ? "\n" + tags.map((t) => `  - ${t}`).join("\n") : " []"}
author: 이영수
draft: true
---

여기에 내용을 작성하세요.
`;

fs.writeFileSync(filePath, frontmatter, "utf-8");
console.log(`✅ 새 포스트 생성: content/posts/${slug}.mdx`);
console.log(`   제목: ${title}`);
console.log(`   날짜: ${today}`);
console.log(`   상태: draft (발행하려면 draft: false로 변경)`);
