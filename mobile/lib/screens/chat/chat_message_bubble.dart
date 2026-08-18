/// Individual chat message bubble with citation chips.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../models/message.dart';
import '../../theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class ChatMessageBubble extends ConsumerWidget {
  const ChatMessageBubble({super.key, required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (message.isSystem) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              message.text,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
            ),
          ),
        ),
      );
    }

    final isUser = message.isUser;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.82,
        ),
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Agent name label.
            if (!isUser && message.agentName != null)
              Padding(
                padding: const EdgeInsets.only(left: 12, bottom: 4),
                child: Text(
                  message.agentName!,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            // Message bubble.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: MarkdownBody(
                data: message.text,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: TextStyle(
                    color: isUser
                        ? theme.colorScheme.onPrimary
                        : theme.colorScheme.onSurface,
                    fontSize: 14,
                    height: 1.4,
                  ),
                  a: TextStyle(
                    color: isUser
                        ? theme.colorScheme.onPrimary
                        : theme.colorScheme.primary,
                  ),
                ),
                onTapLink: (text, href, title) {
                  if (href != null) {
                    launchUrl(Uri.parse(href));
                  }
                },
              ),
            ),
            // Citation chips.
            if (message.citations.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 4, right: 4),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: message.citations.map((c) {
                    return _CitationChip(citation: c);
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CitationChip extends StatelessWidget {
  const _CitationChip({required this.citation});

  final Citation citation;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tinaiColor = AppTheme.tinaiColor(citation.tinai);

    return ActionChip(
      avatar: Icon(
        Icons.menu_book,
        size: 14,
        color: tinaiColor,
      ),
      label: Text(
        citation.verseId,
        style: theme.textTheme.labelSmall?.copyWith(
          color: tinaiColor,
          fontWeight: FontWeight.w600,
        ),
      ),
      backgroundColor: tinaiColor.withOpacity(0.08),
      side: BorderSide(color: tinaiColor.withOpacity(0.3)),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      onPressed: () {
        // TODO: Navigate to verse in Library screen.
      },
    );
  }
}
