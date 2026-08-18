/// Settings screen — API URL configuration, theme toggle, health check.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/chat_provider.dart';
import '../../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // API Connection section.
        _SectionHeader(title: 'API Connection'),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Avai Agent API',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  initialValue: settings.baseUrl,
                  decoration: const InputDecoration(
                    labelText: 'Base URL',
                    hintText: 'http://127.0.0.1:8080',
                  ),
                  onFieldSubmitted: (value) {
                    ref.read(settingsProvider.notifier).setBaseUrl(value);
                    ref.read(avaiApiServiceProvider).updateBaseUrl(value);
                  },
                ),
                const SizedBox(height: 12),
                _HealthCheckButton(),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Appearance section.
        _SectionHeader(title: 'Appearance'),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Theme',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(
                      value: ThemeMode.system,
                      label: Text('System'),
                      icon: Icon(Icons.brightness_auto, size: 18),
                    ),
                    ButtonSegment(
                      value: ThemeMode.light,
                      label: Text('Light'),
                      icon: Icon(Icons.light_mode, size: 18),
                    ),
                    ButtonSegment(
                      value: ThemeMode.dark,
                      label: Text('Dark'),
                      icon: Icon(Icons.dark_mode, size: 18),
                    ),
                  ],
                  selected: {settings.themeMode},
                  onSelectionChanged: (selection) {
                    if (selection.isNotEmpty) {
                      ref
                          .read(settingsProvider.notifier)
                          .setThemeMode(selection.first);
                    }
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // About section.
        _SectionHeader(title: 'About'),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Open Sangam — சங்க அவை',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'An interactive platform bridging ancient Classical Tamil '
                  'Sangam literature with modern readers. Duolingo for '
                  'Ancient Literature.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  '2,552 verses across 18 classical poems',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Agent system: Nakkirar · Avvaiyar · Kapilar · Tholkappiyar · English Scholar',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
    );
  }
}

class _HealthCheckButton extends ConsumerStatefulWidget {
  @override
  ConsumerState<_HealthCheckButton> createState() => _HealthCheckButtonState();
}

class _HealthCheckButtonState extends ConsumerState<_HealthCheckButton> {
  bool? _isHealthy;
  bool _checking = false;

  Future<void> _check() async {
    setState(() {
      _checking = true;
      _isHealthy = null;
    });

    final api = ref.read(avaiApiServiceProvider);
    final healthy = await api.healthCheck();

    if (mounted) {
      setState(() {
        _isHealthy = healthy;
        _checking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        ElevatedButton.icon(
          onPressed: _checking ? null : _check,
          icon: _checking
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.wifi_find, size: 18),
          label: const Text('Check Connection'),
        ),
        if (_isHealthy != null) ...[
          const SizedBox(width: 12),
          Icon(
            _isHealthy! ? Icons.check_circle : Icons.error,
            color: _isHealthy! ? Colors.green : Colors.red,
            size: 20,
          ),
          const SizedBox(width: 4),
          Text(
            _isHealthy! ? 'Connected' : 'Unreachable',
            style: theme.textTheme.bodySmall?.copyWith(
              color: _isHealthy! ? Colors.green : Colors.red,
            ),
          ),
        ],
      ],
    );
  }
}
