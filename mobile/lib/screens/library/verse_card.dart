/// Verse card — displays a single verse with toggleable layers.
library;

import 'package:flutter/material.dart';
import '../../models/verse.dart';
import '../../theme/app_theme.dart';

class VerseCard extends StatefulWidget {
  const VerseCard({super.key, required this.verse});

  final Verse verse;

  @override
  State<VerseCard> createState() => _VerseCardState();
}

class _VerseCardState extends State<VerseCard> {
  // 0 = Sangam Tamil, 1 = Urai (modern Tamil), 2 = English.
  int _layerIndex = 0;

  String get _currentText {
    switch (_layerIndex) {
      case 0:
        return widget.verse.sangamTamil ?? '';
      case 1:
        return widget.verse.urai ?? '';
      case 2:
        return widget.verse.english ?? '';
      default:
        return widget.verse.sangamTamil ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final verse = widget.verse;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Verse number + tinai badge + layer toggle.
            Row(
              children: [
                Text(
                  '#${verse.number}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
                if (verse.tinai != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.tinaiColor(verse.tinai).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      verse.tinai!,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppTheme.tinaiColor(verse.tinai),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                // Layer toggle chips.
                _LayerToggle(
                  layerIndex: _layerIndex,
                  onChanged: (index) => setState(() => _layerIndex = index),
                  hasUrai: verse.urai != null,
                  hasEnglish: verse.english != null,
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Verse text.
            Text(
              _currentText.isNotEmpty ? _currentText : '—',
              style: theme.textTheme.bodyLarge?.copyWith(
                height: 1.6,
                fontWeight: _layerIndex == 0 ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
            // Lines detail (if available and viewing Sangam Tamil).
            if (_layerIndex == 0 && verse.lines.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...verse.lines.map((line) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      '${line.lineNumber}. ${line.text}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                        height: 1.5,
                      ),
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}

class _LayerToggle extends StatelessWidget {
  const _LayerToggle({
    required this.layerIndex,
    required this.onChanged,
    required this.hasUrai,
    required this.hasEnglish,
  });

  final int layerIndex;
  final ValueChanged<int> onChanged;
  final bool hasUrai;
  final bool hasEnglish;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SegmentedButton<int>(
      segments: [
        ButtonSegment(
          value: 0,
          label: const Text('த', style: TextStyle(fontSize: 10)),
        ),
        if (hasUrai)
          const ButtonSegment(
            value: 1,
            label: Text('உ', style: TextStyle(fontSize: 10)),
          ),
        if (hasEnglish)
          const ButtonSegment(
            value: 2,
            label: Text('En', style: TextStyle(fontSize: 10)),
          ),
      ],
      selected: {layerIndex},
      onSelectionChanged: (selection) {
        if (selection.isNotEmpty) onChanged(selection.first);
      },
      style: ButtonStyle(
        visualDensity: VisualDensity.compact,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        textStyle: WidgetStateProperty.all(
          theme.textTheme.labelSmall,
        ),
      ),
    );
  }
}
