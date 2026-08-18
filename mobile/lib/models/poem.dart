/// Poem registry entry — mirrors frontend/src/data/poems.js.
library;

import 'package:flutter/foundation.dart';

@immutable
class PoemRegistry {
  const PoemRegistry({
    required this.id,
    required this.tamilName,
    required this.englishName,
    required this.collection,
    required this.count,
    required this.unit,
    required this.available,
    this.tinai = const [],
  });

  final String id;
  final String tamilName;
  final String englishName;
  final String collection;
  final int count;
  final String unit;
  final bool available;
  final List<String> tinai;

  factory PoemRegistry.fromJson(Map<String, dynamic> json) {
    return PoemRegistry(
      id: json['id'] as String,
      tamilName: json['ta'] as String,
      englishName: json['en'] as String,
      collection: json['collection'] as String,
      count: json['count'] as int,
      unit: json['unit'] as String,
      available: json['available'] as bool? ?? false,
      tinai: (json['tinai'] as List<dynamic>?)
              ?.map((t) => t as String)
              .toList() ??
          [],
    );
  }
}

/// Collection metadata.
@immutable
class Collection {
  const Collection({
    required this.id,
    required this.tamilName,
    required this.englishName,
    required this.description,
  });

  final String id;
  final String tamilName;
  final String englishName;
  final String description;

  factory Collection.fromJson(Map<String, dynamic> json) {
    return Collection(
      id: json['id'] as String,
      tamilName: json['ta'] as String,
      englishName: json['en'] as String,
      description: json['desc'] as String,
    );
  }
}
