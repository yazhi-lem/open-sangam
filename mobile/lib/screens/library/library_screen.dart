/// Library screen — browse poems and read verses.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/poem.dart';
import '../../providers/poem_provider.dart';
import 'poem_card.dart';
import 'poem_reader_screen.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final poemsAsync = ref.watch(poemsProvider);

    return poemsAsync.when(
      data: (poems) => _PoemGrid(poems: poems),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }
}

class _PoemGrid extends StatelessWidget {
  const _PoemGrid({required this.poems});

  final List<PoemRegistry> poems;

  @override
  Widget build(BuildContext context) {
    final anthologies = poems.where((p) => p.collection == '8thokai').toList();
    final idylls = poems.where((p) => p.collection == '10paddu').toList();

    return CustomScrollView(
      slivers: [
        // Eight Anthologies section.
        SliverToBoxAdapter(
          child: _SectionHeader(
            tamil: 'எட்டுத்தொகை',
            english: 'Eight Anthologies',
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => PoemCard(poem: anthologies[index]),
              childCount: anthologies.length,
            ),
          ),
        ),
        // Ten Idylls section.
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
        SliverToBoxAdapter(
          child: _SectionHeader(
            tamil: 'பத்துப்பாட்டு',
            english: 'Ten Idylls',
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => PoemCard(poem: idylls[index]),
              childCount: idylls.length,
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.tamil, required this.english});

  final String tamil;
  final String english;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tamil,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            english,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }
}
