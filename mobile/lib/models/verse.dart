/// Verse data model matching the canonical verse schema.
library;

import 'package:flutter/foundation.dart';

@immutable
class Verse {
  const Verse({
    required this.id,
    required this.poem,
    required this.number,
    this.tinai,
    this.poet,
    this.sangamTamil,
    this.urai,
    this.english,
    this.lines = const [],
    this.verified = false,
    this.source,
    this.culturalNotes = const [],
  });

  final String id;
  final String poem;
  final int number;
  final String? tinai;
  final String? poet;
  final String? sangamTamil;
  final String? urai;
  final String? english;
  final List<VerseLine> lines;
  final bool verified;
  final String? source;
  final List<CulturalNote> culturalNotes;

  factory Verse.fromJson(Map<String, dynamic> json) {
    return Verse(
      id: json['id'] as String,
      poem: json['poem'] as String,
      number: json['number'] as int,
      tinai: json['tinai'] as String?,
      poet: json['poet'] as String?,
      sangamTamil: json['sangamTamil'] as String?,
      urai: json['urai'] as String?,
      english: json['english'] as String?,
      lines: (json['lines'] as List<dynamic>?)
              ?.map((l) => VerseLine.fromJson(l as Map<String, dynamic>))
              .toList() ??
          [],
      verified: json['verified'] as bool? ?? false,
      source: json['source'] as String?,
      culturalNotes: (json['culturalNotes'] as List<dynamic>?)
              ?.map((n) => CulturalNote.fromJson(n as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

@immutable
class VerseLine {
  const VerseLine({
    required this.lineNumber,
    required this.text,
    this.words = const [],
  });

  final int lineNumber;
  final String text;
  final List<VerseWord> words;

  factory VerseLine.fromJson(Map<String, dynamic> json) {
    return VerseLine(
      lineNumber: json['lineNumber'] as int,
      text: json['text'] as String,
      words: (json['words'] as List<dynamic>?)
              ?.map((w) => VerseWord.fromJson(w as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

@immutable
class VerseWord {
  const VerseWord({
    required this.form,
    this.root,
    this.urichol,
    this.etymology,
    this.gloss,
  });

  final String form;
  final String? root;
  final String? urichol;
  final String? etymology;
  final String? gloss;

  factory VerseWord.fromJson(Map<String, dynamic> json) {
    return VerseWord(
      form: json['form'] as String,
      root: json['root'] as String?,
      urichol: json['urichol'] as String?,
      etymology: json['etymology'] as String?,
      gloss: json['gloss'] as String?,
    );
  }
}

@immutable
class CulturalNote {
  const CulturalNote({
    required this.title,
    required this.category,
    required this.description,
    this.sourceVerse,
    this.references = const [],
  });

  final String title;
  final String category;
  final String description;
  final String? sourceVerse;
  final List<String> references;

  factory CulturalNote.fromJson(Map<String, dynamic> json) {
    return CulturalNote(
      title: json['title'] as String,
      category: json['category'] as String,
      description: json['description'] as String,
      sourceVerse: json['sourceVerse'] as String?,
      references: (json['references'] as List<dynamic>?)
              ?.map((r) => r as String)
              .toList() ??
          [],
    );
  }
}
