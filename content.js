console.log("[Notion Cmd+Enter Extension] loaded ✅");

// 共通処理
function handleKeyDown(e) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const isCmdEnter = isMac ? e.metaKey && e.key === 'Enter' : e.ctrlKey && e.key === 'Enter';
  const isPlainEnter = !e.metaKey && !e.ctrlKey && e.key === 'Enter';
  const el = e.target;

  // コメント欄のtextarea/contenteditableを想定
  if (el && el.isContentEditable && el.closest('[role="dialog"]')) {
    if (isPlainEnter) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // ← これ重要
        document.execCommand('insertLineBreak');
        console.log("[Notion Cmd+Enter] 改行しました（強制版）");
        return;
      }
      
    if (isCmdEnter) {
      console.log("[Notion Cmd+Enter] Command+Enter → 送信");

      // コメント欄では Enter 送信をシミュレート
      // blur() で Notion のコメント送信が走る場合が多い
      el.blur();

      // フォールバック：ボタン探してクリック（念のため）
      const sendBtn = document.querySelector('button[aria-label="Send"]') || document.querySelector('button[aria-label="コメントを送信"]');
      if (sendBtn) {
        sendBtn.click();
      }
    }
  }
}

// ハンドラ付与
function attachHandlers(doc) {
  if (doc._cmdEnterHooked) return;
  doc._cmdEnterHooked = true;
  doc.addEventListener('keydown', handleKeyDown);
  console.log("[Notion Cmd+Enter] attached to document/iframe");
}

attachHandlers(document);

// iframe対策
new MutationObserver(() => {
  document.querySelectorAll('iframe').forEach((f) => {
    try {
      if (f.contentDocument) attachHandlers(f.contentDocument);
    } catch (err) {}
  });
}).observe(document.body, { childList: true, subtree: true });

// Slack風キャプション追加
function addCaption() {
  document.querySelectorAll('[role="dialog"]').forEach(dialog => {
    if (!dialog.querySelector('.cmd-enter-caption')) {
      const caption = document.createElement('div');
      caption.className = 'cmd-enter-caption';
      caption.textContent = '⌘ + Enter で送信';
      caption.style.fontSize = '12px';
      caption.style.color = '#888';
      caption.style.marginTop = '4px';
      caption.style.marginLeft = '4px';
      caption.style.userSelect = 'none';
      caption.style.opacity = '0.7';
      caption.style.transition = 'opacity 0.2s ease';
      caption.addEventListener('mouseenter', () => caption.style.opacity = '1');
      caption.addEventListener('mouseleave', () => caption.style.opacity = '0.7');
      dialog.appendChild(caption);
      console.log("[Notion Cmd+Enter] キャプション追加");
    }
  });
}

new MutationObserver(addCaption).observe(document.body, { childList: true, subtree: true });