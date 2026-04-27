import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:frontend/services/auth_service.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketService._internal();
  static final WebSocketService instance = WebSocketService._internal();

  WebSocketChannel? _channel;
  final StreamController<dynamic> _messageController = StreamController.broadcast();
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _shouldReconnect = true;
  DateTime? _lastPingAt;

  Stream<dynamic> get messages => _messageController.stream;

  String _defaultWsBase() {
    return 'wss://northbridge.onrender.com';
  }

  Uri _buildWebSocketUri({
    required String base,
    String? token,
    String? sessionUserId,
    required bool shouldOverride,
  }) {
    final baseUri = Uri.parse(base);

    if (token != null && token.isNotEmpty) {
      return baseUri.replace(
        path: '/',
        queryParameters: {'token': token},
      );
    }

    if (shouldOverride) {
      return baseUri.replace(
        path: '/',
        queryParameters: {'x-user-id': sessionUserId ?? 'dev'},
      );
    }

    return baseUri.replace(path: '/');
  }

  Future<void> connect({String? token, bool override = false}) async {
    if (_channel != null) return;

    final auth = AuthService();
    final resolved = token ?? await auth.getIdToken();
    final sessionUserId = auth.getSessionUserId();
    final normalizedToken = resolved?.trim();

    if ((normalizedToken == null || normalizedToken.isEmpty) &&
        (sessionUserId == null || sessionUserId.isEmpty) &&
        !override) {
      _shouldReconnect = false;
      return;
    }

    final base = _defaultWsBase();
    final shouldOverride = override ||
        ((normalizedToken == null || normalizedToken.isEmpty) &&
            sessionUserId != null &&
            sessionUserId.isNotEmpty) ||
        ((normalizedToken == null || normalizedToken.isEmpty) && kDebugMode);
    final uri = _buildWebSocketUri(
      base: base,
      token: normalizedToken,
      sessionUserId: sessionUserId,
      shouldOverride: shouldOverride,
    );

    try {
      _shouldReconnect = true;
      _channel = WebSocketChannel.connect(uri);
      _reconnectAttempts = 0;

      _channel!.stream.listen((event) {
        try {
          final parsed = jsonDecode(event as String);
          _messageController.add(parsed);
        } catch (_) {
          _messageController.add(event);
        }
      }, onDone: _handleDone, onError: _handleError, cancelOnError: true);
      await touch(force: true);
    } catch (e) {
      _messageController.add({'type': 'ERROR', 'error': e.toString()});
      _attemptReconnect();
    }
  }

  Future<void> touch({bool force = false}) async {
    if (_channel == null) {
      return;
    }

    final now = DateTime.now();
    final lastPingAt = _lastPingAt;
    if (!force &&
        lastPingAt != null &&
        now.difference(lastPingAt) < const Duration(seconds: 15)) {
      return;
    }

    _lastPingAt = now;
    try {
      _channel?.sink.add(jsonEncode({'type': 'PING'}));
    } catch (_) {}
  }

  void _handleDone() {
    _messageController.add({'type': 'CLOSED'});
    _cleanupChannel();
    _attemptReconnect();
  }

  void _handleError(Object error) {
    _messageController.add({'type': 'ERROR', 'error': error.toString()});
    _cleanupChannel();
    _attemptReconnect();
  }

  void _cleanupChannel() {
    try {
      _reconnectTimer?.cancel();
      _channel?.sink.close();
    } catch (_) {}
    _lastPingAt = null;
    _channel = null;
  }

  void _attemptReconnect() {
    if (!_shouldReconnect) {
      return;
    }

    _reconnectAttempts = math.min(6, _reconnectAttempts + 1);
    final wait = math.min(60, math.pow(2, _reconnectAttempts)).toInt();
    _reconnectTimer = Timer(Duration(seconds: wait), () => connect());
  }

  Future<void> send(String type, dynamic data) async {
    if (_channel == null) return;
    await touch();
    final msg = jsonEncode({'type': type, 'data': data});
    _channel!.sink.add(msg);
  }

  Future<void> disconnect() async {
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    try {
      await _channel?.sink.close();
    } catch (_) {}
    _channel = null;
  }
}
