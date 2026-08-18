/// Chat state management — per-agent sessions and message history.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/message.dart';
import '../models/sangam_agent.dart';
import '../services/avai_api_service.dart';

/// Active agent selector.
final activeAgentProvider = StateProvider<SangamAgent>(
  (ref) => SangamAgent.nakkirar,
);

/// API service provider.
final avaiApiServiceProvider = Provider<AvaiApiService>((ref) {
  return AvaiApiService();
});

/// Per-agent session IDs — enables multi-turn with each agent separately.
final sessionIdsProvider =
    StateProvider<Map<String, String>>((ref) => {});

/// Chat messages for the currently active agent.
final chatMessagesProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessage>>((ref) {
  return ChatNotifier(ref);
});

/// Loading state for the current agent request.
final chatLoadingProvider = StateProvider<bool>((ref) => false);

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier(this._ref) : super([]);

  final Ref _ref;

  /// Send a user message to the active agent.
  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final agent = _ref.read(activeAgentProvider);
    final api = _ref.read(avaiApiServiceProvider);
    final sessionIds = Map<String, String>.from(_ref.read(sessionIdsProvider));

    // Add user message.
    state = [
      ...state,
      ChatMessage(
        role: MessageRole.user,
        text: text.trim(),
        timestamp: DateTime.now(),
      ),
    ];

    _ref.read(chatLoadingProvider.notifier).state = true;

    try {
      final response = await api.ask(
        message: text.trim(),
        agent: agent.id,
        sessionId: sessionIds[agent.id],
      );

      // Save session ID for multi-turn continuity.
      sessionIds[agent.id] = response.sessionId;
      _ref.read(sessionIdsProvider.notifier).state = sessionIds;

      // Add agent response.
      state = [
        ...state,
        ChatMessage(
          role: MessageRole.agent,
          text: response.responseText,
          agentId: agent.id,
          agentName: agent.englishName,
          citations: response.citations,
          timestamp: DateTime.now(),
        ),
      ];
    } catch (e) {
      state = [
        ...state,
        ChatMessage(
          role: MessageRole.system,
          text: 'Error: ${e.toString()}',
          timestamp: DateTime.now(),
        ),
      ];
    } finally {
      _ref.read(chatLoadingProvider.notifier).state = false;
    }
  }

  /// Clear all messages for the active agent.
  void clearChat() {
    state = [];
  }
}
