import re
with open(r'F:\AISTUDIO\neumorphic-ui\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
old_block = '      <ChannelCommentsView' + chr(10) + '        isOpen={showComments}' + chr(10) + '        postId={activePostId || 0}' + chr(10) + '        onClose={() => setShowComments(false)}' + chr(10) + '        theme={theme}' + chr(10) + '      />'
new_block = '      <ChannelCommentsView' + chr(10) + '        isOpen={showComments}' + chr(10) + '        postId={activePostId || 0}' + chr(10) + '        onClose={() => setShowComments(false)}' + chr(10) + '        theme={theme}' + chr(10) + '        channelChatId={String(activeChat?.id or "")}' + chr(10) + '        postKey=""' + chr(10) + '      />'
content = content.replace(old_block, new_block, 1)
with open(r'F:\AISTUDIO\neumorphic-ui\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
