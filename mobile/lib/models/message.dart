/// A single chat message in the conversation.
library;

import 'package:flutter/foundation.dart';

enum MessageRole { user, agent, system }

@immutable
class ChatMessage {
  const ChatMessage({
    required this.role,
    required this.text,
    this.agentId,
    this.agentName,
    this.citations = const [],
    this.timestamp,
  });

  final MessageRole role;
  final String text;
  final String? agentId;
  final String? agentName;
  final List<Citation> citations;
  final DateTime? timestamp;

  bool get isUser => role == MessageRole.user;
  bool get isAgent => role == MessageRole.agent;
  bool get isSystem => role == MessageRole.system;
}

@immutable
class Citation {
  const Citation({
    required this.verseId,
    this.poem,
    this.tinai,
    this.poet,
  });

  final String verseId;
  final String? poem;
  final String? tinai;
  final String? poet;

  factory Citation.fromJson(Map<String, dynamic> json) {
    return Citation(
      verseId: json['verse_id'] as String,
      poem: json['poem'] as String?,
      tinai: json['tinai'] as String?,
      poet: json['poet'] as String?,
    );
  }
}

@immutable
class AskRequest {
  const AskRequest({
    required this.message,
    this.agent = 'nakkirar',
    this.workflow = 'qa',
    this.sessionId,
    this.userId,
    this.context,
  });

  final String message;
  final String agent;
  final String workflow;
  final String? sessionId;
  final String? userId;
  final AskContext? context;

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'agent': agent,
      'workflow': workflow,
      if (sessionId != null) 'session_id': sessionId,
      if (userId != null) 'user_id': userId,
      if (context != null) 'context': context!.toJson(),
    };
  }
}

@immutable
class AskContext {
  const AskContext({this.tinai, this.poem, this.limit = 10});

  final String? tinai;
  final String? poem;
  final int limit;

  Map<String, dynamic> toJson() {
    return {
      if (tinai != null) 'tinai': tinai,
      if (poem != null) 'poem': poem,
      'limit': limit,
    };
  }
}

@immutable
class AskResponse {
  const AskResponse({
    required this.sessionId,
    required this.workflow,
    required this.poet,
    required this.responseText,
    this.citations = const [],
    this.metadata,
  });

  final String sessionId;
  final String workflow;
  final String poet;
  final String responseText;
  final List<Citation> citations;
  final AskMetadata? metadata;

  factory AskResponse.fromJson(Map<String, dynamic> json) {
    return AskResponse(
      sessionId: json['session_id'] as String,
      workflow: json['workflow'] as String,
      poet: json['poet'] as String,
      responseText: json['response_text'] as String,
      citations: (json['citations'] as List<dynamic>?)
              ?.map((c) => Citation.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      metadata: json['metadata'] != null
          ? AskMetadata.fromJson(json['metadata'] as Map<String, dynamic>)
          : null,
    );
  }
}

@immutable
class AskMetadata {
  const AskMetadata({
    required this.model,
    required this.elapsedMs,
    required this.timestamp,
  });

  final String model;
  final int elapsedMs;
  final String timestamp;

  factory AskMetadata.fromJson(Map<String, dynamic> json) {
    return AskMetadata(
      model: json['model'] as String,
      elapsedMs: json['elapsed_ms'] as int,
      timestamp: json['timestamp'] as String,
    );
  }
}
