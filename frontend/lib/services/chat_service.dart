import 'package:frontend/models/chat_model.dart';
import 'package:frontend/models/message_model.dart';
import 'package:frontend/models/task_model.dart';
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
    String? imageDataUrl,
    bool isPaymentRequest = false,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    final message = MessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      chatId: chatId,
      taskId: taskId,
      senderId: senderId,
      text: text,
      timestamp: DateTime.now().toUtc(),
      imageDataUrl: imageDataUrl,
      isPaymentRequest: isPaymentRequest,
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

  Future<ChatModel> getOrCreateTaskChat({
    required TaskModel task,
    required String helperUserId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    final existing = _chatStore.firstWhere(
      (chat) {
        final users = (chat['users'] as List<dynamic>).cast<String>();
        return chat['taskId'] == task.id &&
            users.contains(task.postedByUserId) &&
            users.contains(helperUserId);
      },
      orElse: () => const <String, dynamic>{},
    );

    if (existing.isNotEmpty) {
      return ChatModel.fromJson(existing);
    }

    final now = DateTime.now().toUtc();
    final chatId = 'c_${now.microsecondsSinceEpoch}';
    final firstMessage = MessageModel(
      id: 'm_${now.microsecondsSinceEpoch}',
      chatId: chatId,
      taskId: task.id,
      senderId: task.postedByUserId,
      text: 'Task accepted. Let\'s coordinate the details.',
      timestamp: now,
    );

    final newChat = ChatModel(
      chatId: chatId,
      taskId: task.id,
      taskTitle: task.title,
      taskOwnerUserId: task.postedByUserId,
      taskOwnerName: task.postedByName,
      users: [task.postedByUserId, helperUserId],
      lastMessage: firstMessage,
    );

    _messageStore = [
      ..._messageStore,
      firstMessage.toJson(),
    ];
    _chatStore = [
      newChat.toJson(),
      ..._chatStore,
    ];

    return newChat;
  }
}
