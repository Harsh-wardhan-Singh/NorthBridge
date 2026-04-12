import 'package:frontend/models/chat_model.dart';
import 'package:frontend/models/message_model.dart';
import 'package:frontend/services/test_data/chat_test_data.dart';
import 'package:frontend/services/test_data/message_test_data.dart';

class ChatService {
  static List<Map<String, dynamic>> _chatStore = chatPreviewApiResponse
      .map((chat) => Map<String, dynamic>.from(chat))
      .toList();
  static List<Map<String, dynamic>> _messageStore = messagePreviewApiResponse
      .map((message) => Map<String, dynamic>.from(message))
      .toList();

  Future<List<ChatModel>> fetchChats() async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return _chatStore.map(ChatModel.fromJson).toList(growable: false);
  }

  Future<List<MessageModel>> fetchMessages(String chatId) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return _messageStore
        .map(MessageModel.fromJson)
        .where((message) => message.chatId == chatId)
        .toList(growable: false);
  }

  Future<MessageModel> sendMessage({
    required String chatId,
    required String taskId,
    required String senderId,
    required String text,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    final message = MessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      chatId: chatId,
      taskId: taskId,
      senderId: senderId,
      text: text,
      timestamp: DateTime.now().toUtc(),
    );

    _messageStore = [
      ..._messageStore,
      message.toJson(),
    ];

    final chatIndex = _chatStore.indexWhere((chat) => chat['chatId'] == chatId);
    if (chatIndex >= 0) {
      final updated = Map<String, dynamic>.from(_chatStore[chatIndex]);
      updated['lastMessage'] = message.toJson();

      final next = List<Map<String, dynamic>>.from(_chatStore);
      next[chatIndex] = updated;
      _chatStore = next;
    }

    return message;
  }
}
