#!/usr/bin/env node
/**
 * 모든 React 함수형 컴포넌트에 console.log('[파일경로] ComponentName rendered') 추가
 * 마커: // __component_log__ 로 중복 실행 방지
 */

const fs = require('fs');
const path = require('path');

const MARKER = '// __component_log__';
const SRC_DIR = path.join(__dirname, '..', 'src');

function findTsxFiles(dir) {
  const result = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && item !== 'node_modules') {
      result.push(...findTsxFiles(full));
    } else if (
      item.endsWith('.tsx') &&
      !item.endsWith('.stories.tsx') &&
      !item.endsWith('.test.tsx')
    ) {
      result.push(full);
    }
  }
  return result;
}

/**
 * 문자열에서 pos 위치의 문자부터 괄호 깊이를 추적해
 * 열린 괄호(open)의 짝이 맞는 닫힌 괄호 위치를 반환
 */
function findMatchingClose(str, openPos, open = '(', close = ')') {
  let depth = 0;
  for (let i = openPos; i < str.length; i++) {
    if (str[i] === open) depth++;
    else if (str[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * 주어진 pos 이후 첫 번째 '{' 위치를 반환 (단, template literal, string은 스킵)
 */
function findNextBrace(str, from) {
  let i = from;
  while (i < str.length) {
    const c = str[i];
    if (c === '{') return i;
    // skip strings
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < str.length && str[i] !== quote) {
        if (str[i] === '\\') i++; // escape
        i++;
      }
    }
    i++;
  }
  return -1;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 이미 처리된 파일은 건너뜀
  if (content.includes(MARKER)) return false;

  const rel = 'src/' + path.relative(SRC_DIR, filePath);

  // function ComponentName 패턴 (대문자로 시작하는 컴포넌트만)
  const funcPattern = /\bfunction\s+([A-Z][a-zA-Z0-9_]*)\s*[<(]/g;

  const insertions = []; // { pos, text }

  let match;
  while ((match = funcPattern.exec(content)) !== null) {
    const componentName = match[1];
    const matchStart = match.index;

    // 제네릭 타입 파라미터 건너뜀 (<T extends ...>)
    let pos = matchStart + match[0].length - 1; // '(' 또는 '<' 위치
    if (content[pos] === '<') {
      const closeAngle = findMatchingClose(content, pos, '<', '>');
      if (closeAngle === -1) continue;
      pos = closeAngle + 1;
      // '(' 찾기
      while (pos < content.length && content[pos] !== '(') pos++;
    }

    // 파라미터 괄호 닫힘 위치 찾기
    const closeParenPos = findMatchingClose(content, pos, '(', ')');
    if (closeParenPos === -1) continue;

    // 반환 타입 어노테이션 건너뜀 → 첫 번째 '{' 찾기
    const bracePos = findNextBrace(content, closeParenPos + 1);
    if (bracePos === -1) continue;

    // 함수 바디 여는 중괄호 바로 다음에 삽입
    insertions.push({
      pos: bracePos + 1,
      text: `\n  console.log('[${rel}] ${componentName}'); ${MARKER}`,
    });
  }

  if (insertions.length === 0) return false;

  // 뒤에서부터 삽입해야 위치가 밀리지 않음
  insertions.sort((a, b) => b.pos - a.pos);
  for (const { pos, text } of insertions) {
    content = content.slice(0, pos) + text + content.slice(pos);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return insertions.length;
}

const files = findTsxFiles(SRC_DIR);
let totalFiles = 0;
let totalComponents = 0;

for (const file of files) {
  const count = processFile(file);
  if (count) {
    const rel = 'src/' + path.relative(SRC_DIR, file);
    console.log(`✓ ${rel} (${count}개 컴포넌트)`);
    totalFiles++;
    totalComponents += count;
  }
}

console.log(`\n완료: ${totalFiles}개 파일, ${totalComponents}개 컴포넌트 처리됨`);
