/// Poem and verse data state management.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/poem.dart';
import '../models/verse.dart';
import '../services/verse_data_service.dart';

/// Poems registry — loaded once from assets.
final poemsProvider = FutureProvider<List<PoemRegistry>>((ref) async {
  return VerseDataService.instance.loadPoems();
});

/// Currently selected poem ID.
final selectedPoemIdProvider = StateProvider<String?>((ref) => null);

/// Currently selected verse number (for verse detail view).
final selectedVerseNumberProvider = StateProvider<int?>(ref => null);

/// Verses for the currently selected poem.
final poemVersesProvider = FutureProvider<List<Verse>>((ref) async {
  final poemId = ref.watch(selectedPoemIdProvider);
  if (poemId == null) return [];
  return VerseDataService.instance.loadVerses(poemId);
});

/// Search query for the library.
final librarySearchQueryProvider = StateProvider<String>((ref) => '');

/// Search results.
final searchResultsProvider = FutureProvider<List<Verse>>((ref) async {
  final query = ref.watch(librarySearchQueryProvider);
  if (query.trim().isEmpty) return [];
  return VerseDataService.instance.searchVerses(query);
});
