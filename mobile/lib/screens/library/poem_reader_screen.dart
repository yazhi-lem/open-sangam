/// Poem reader — displays verses for a single poem with layer toggle.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/poem.dart';
import '../../models/verse.dart';
import '../../providers/poem_provider.dart';
import '../../theme/app_theme.dart';
import 'verse_card.dart';

class PoemReaderScreen extends ConsumerStatefulWidget {
  const PoemReaderScreen({super.key, required this.poem});

  final PoemRegistry poem;

  @override
  ConsumerState<PoemReaderScreen> createState() => _PoemReaderScreenState();
}

class _PoemReaderScreenState extends ConsumerState<PoemReaderScreen> {
  @override
  void initState() {
    super.initState();
    // Set the selected poem to trigger verse loading.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(selectedPoemIdProvider.notifier).state = widget.poem.id;
    });
  }

  @override
  Widget build(BuildContext context) {
    final versesAsync = ref.watch(poemVersesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              widget.poem.tamilName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text(
              '${widget.poem.englishName} · ${widget.poem.count} ${widget.poem.unit}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
            ),
          ],
        ),
      ),
      body: versesAsync.when(
        data: (verses) => _VerseList(verses: verses),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _VerseList extends StatelessWidget {
  const _VerseList({required this.verses});

  final List<Verse> verses;

  @override
  Widget build(BuildContext context) {
    if (verses.isEmpty) {
      return const Center(
        child: Text('No verses available for this poem.'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: verses.length,
      itemBuilder: (context, index) {
        return VerseCard(verse: verses[index]);
      },
    );
  }
}
