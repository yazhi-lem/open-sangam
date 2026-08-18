/// API configuration — default URLs and timeouts.
library;

class ApiConfig {
  ApiConfig._();

  /// Default Avai Agent API base URL (local dev server).
  static const String defaultBaseUrl = 'http://127.0.0.1:8080';

  /// Default Firebase Cloud Functions URL for translate/analyze-word.
  static const String defaultFunctionsUrl = 'http://127.0.0.1:5001';

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 60);
}
