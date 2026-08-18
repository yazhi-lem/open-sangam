/// Load poem verse data from bundled JSON assets.
library;

import 'dart:convert';
import 'package:flutter/services.dart';
import '../models/poem.dart';
import '../models/verse.dart';

/// Static poems registry loaded from assets at startup.
class VerseDataService {
  VerseDataService._();
  static final VerseDataService instance = VerseDataService._();

  List<PoemRegistry>? _poems;
  final Map<String, List<Verse>> _verseCache = {};

  /// Load the poems registry from the bundled JSON asset.
  Future<List<PoemRegistry>> loadPoems() async {
    if (_poems != null) return _poems!;

    final jsonStr =
        await rootBundle.loadString('assets/data/poems_registry.json');
    final data = jsonDecode(jsonStr) as Map<String, dynamic>;
    final poemsList = data['poems'] as List<dynamic>;

    _poems = poemsList
        .map((p) => PoemRegistry.fromJson(p as Map<String, dynamic>))
        .toList();
    return _poems!;
  }

  /// Load verses for a specific poem from its bundled JSON asset.
  Future<List<Verse>> loadVerses(String poemId) async {
    if (_verseCache.containsKey(poemId)) return _verseCache[poemId]!;

    try {
      final jsonStr =
          await rootBundle.loadString('assets/data/texts/$poemId.json');
      final data = jsonDecode(jsonStr) as List<dynamic>;
      final verses = data
          .map((v) => Verse.fromJson(v as Map<String, dynamic>))
          .toList();
      _verseCache[poemId] = verses;
      return verses;
    } catch (e) {
      // Verse file not bundled — return empty list.
      return [];
    }
  }

  /// Search verses across all loaded poems for a query string.
  Future<List<Verse>> searchVerses(String query, {String? poemId}) async {
    final results = <Verse>[];
    final queryLower = query.toLowerCase();

    for (final poem in _poems ?? await loadPoems()) {
      if (!poem.available) continue;
      if (poemId != null && poem.id != poemId) continue;

      final verses = await loadVerses(poem.id);
      for (final verse in verses) {
        final haystack = [
          verse.sangamTamil ?? '',
          verse.urai ?? '',
          verse.english ?? '',
        ].join(' ').toLowerCase();

        if (haystack.contains(queryLower)) {
          results.add(verse);
          if (results.length >= 20) break;
        }
      }
      if (results.length >= 20) break;
    }
    return results;
  }
}
