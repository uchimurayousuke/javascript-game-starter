"use strict";

const japaneseText = '(?:(?!</p>)[\\s\\S])*[\\u3040-\\u30ff\\u3400-\\u9fff](?:(?!</p>)[\\s\\S])*';
const excerpt = new RegExp('<div class="reading-walkthrough">[\\s\\S]*?<pre class="reading-code"><code>[\\s\\S]*?</code></pre>\\s*<p>' + japaneseText + '</p>');
const direct = new RegExp('<p>変更後（コピー用）：</p><pre><code>[\\s\\S]*?</code></pre>(?:</details>)*\\s*<p>' + japaneseText + '</p>');

function hasInlineExplanation(section) {
  return excerpt.test(section) || direct.test(section);
}

module.exports = { hasInlineExplanation };
