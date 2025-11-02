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
      e.stopImmediatePropagation();
      document.execCommand('insertLineBreak');
      console.log("[Notion Cmd+Enter] 改行しました（強制版）");
      return;
    }

    if (isCmdEnter) {
      console.log("[Notion Cmd+Enter] Command+Enter → 送信");
      el.blur();

      // フォールバック：送信ボタン探してクリック
      const sendBtn =
        el.closest('[role="dialog"]').querySelector('button[aria-label="Send"]') ||
        el.closest('[role="dialog"]').querySelector('button[aria-label="コメントを送信"]');
      if (sendBtn) sendBtn.click();
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

// iframe対応
new MutationObserver(() => {
  document.querySelectorAll('iframe').forEach((f) => {
    try {
      if (f.contentDocument) attachHandlers(f.contentDocument);
    } catch (err) {}
  });
}).observe(document.body, { childList: true, subtree: true });

function addCaption() {
    document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
      if (!dialog.querySelector('.cmd-enter-caption')) {
        const caption = document.createElement('div');
        caption.className = 'cmd-enter-caption';
        caption.textContent = '⌘ + Enter で送信';
        Object.assign(caption.style, {
          fontSize: '12px',
          color: '#999',
          marginRight: '18px',
          textAlign: 'right',
          position: 'absolute',
          bottom: '4px',
          right: '0',
          width: 'calc(100% - 18px)',
          userSelect: 'none',
          opacity: '0', // ← 初期状態は非表示
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
        });
        dialog.style.position = 'relative';
        dialog.appendChild(caption);
        console.log("[Notion Cmd+Enter] キャプション追加");
      }
    });
  }
  
  // --- フォーカス時の動作 ---
  function setupFocusWatcher() {
    document.querySelectorAll('[role="dialog"] [contenteditable="true"]').forEach((input) => {
      if (input._focusHooked) return;
      input._focusHooked = true;
  
      input.addEventListener('focus', () => {
        const caption = input.closest('[role="dialog"]')?.querySelector('.cmd-enter-caption');
        if (caption) caption.style.opacity = '1'; // ← フォーカス時にフェードイン
        input.style.paddingBottom = '22px'; // ← 余白を確保
      });
  
      input.addEventListener('blur', () => {
        const caption = input.closest('[role="dialog"]')?.querySelector('.cmd-enter-caption');
        if (caption) caption.style.opacity = '0'; // ← フェードアウトして非表示
        input.style.paddingBottom = ''; // ← 元に戻す
      });
    });
  }
  
  const observer = new MutationObserver(() => {
    addCaption();
    setupFocusWatcher();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  addCaption();
  setupFocusWatcher();