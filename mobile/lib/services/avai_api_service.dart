/// HTTP client for the Avai Agent REST API.
library;

import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/message.dart';

class AvaiApiService {
  AvaiApiService({String? baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? ApiConfig.defaultBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 60),
          headers: {'Content-Type': 'application/json'},
        ));

  final Dio _dio;

  /// Update the base URL at runtime (from settings screen).
  void updateBaseUrl(String url) {
    _dio.options.baseUrl = url;
  }

  /// Send a message to a specific agent and get a response.
  Future<AskResponse> ask({
    required String message,
    required String agent,
    String? sessionId,
    String? userId,
    AskContext? context,
  }) async {
    final request = AskRequest(
      message: message,
      agent: agent,
      sessionId: sessionId,
      userId: userId,
      context: context,
    );

    final response = await _dio.post('/avai/ask', data: request.toJson());
    return AskResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// Check if the API server is reachable.
  Future<bool> healthCheck() async {
    try {
      final response = await _dio.get('/avai/health');
      return response.statusCode == 200;
    } on DioException {
      return false;
    }
  }
}
