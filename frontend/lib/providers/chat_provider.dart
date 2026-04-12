import 'package:flutter/foundation.dart';
import 'package:frontend/core/state/view_state.dart';
import 'package:frontend/models/chat_model.dart';
import 'package:frontend/models/message_model.dart';
import 'package:frontend/services/chat_service.dart';

class ChatProvider extends ChangeNotifier {
  ChatProvider({ChatService? chatService})
      : _chatService = chatService ?? ChatService(),
        _state = ViewState<List<ChatModel>>.loading();

  final ChatService _chatService;

  ViewState<List<ChatModel>> _state;
  ViewState<List<ChatModel>> get state => _state;
  ViewState<List<MessageModel>> _messagesState =
      ViewState<List<MessageModel>>.empty();
  ViewState<List<MessageModel>> get messagesState => _messagesState;
  bool _isSendingMessage = false;
  bool get isSendingMessage => _isSendingMessage;

  Future<void> loadChats() async {
    _state = ViewState<List<ChatModel>>.loading(previousData: _state.data);
    notifyListeners();

    try {
      final chats = await _chatService.fetchChats();
      if (chats.isEmpty) {
        _state = ViewState<List<ChatModel>>.empty(message: 'No chats yet.');
      } else {
        _state = ViewState<List<ChatModel>>.success(chats);
      }
    } catch (_) {
      _state = ViewState<List<ChatModel>>.error(
        'Unable to load chats right now.',
      );
    }

    notifyListeners();
  }

  Future<void> loadMessages(String chatId) async {
    _messagesState = ViewState<List<MessageModel>>.loading(
      previousData: _messagesState.data,
    );
    notifyListeners();

    try {
      final messages = await _chatService.fetchMessages(chatId);
      if (messages.isEmpty) {
        _messagesState = ViewState<List<MessageModel>>.empty(
          message: 'No messages yet.',
        );
      } else {
        _messagesState = ViewState<List<MessageModel>>.success(messages);
      }
    } catch (_) {
      _messagesState = ViewState<List<MessageModel>>.error(
        'Unable to load messages right now.',
      );
    }

    notifyListeners();
  }

  Future<void> sendMessage({
    required String chatId,
    required String taskId,
    required String senderId,
    required String text,
  }) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      return;
    }

    _isSendingMessage = true;
    notifyListeners();

    try {
      final created = await _chatService.sendMessage(
        chatId: chatId,
        taskId: taskId,
        senderId: senderId,
        text: trimmed,
      );

      final currentMessages =
          List<MessageModel>.from(_messagesState.data ?? const []);
      currentMessages.add(created);
      _messagesState = ViewState<List<MessageModel>>.success(currentMessages);

      final chats = List<ChatModel>.from(_state.data ?? const []);
      final chatIndex = chats.indexWhere((chat) => chat.chatId == chatId);
      if (chatIndex >= 0) {
        final current = chats[chatIndex];
        chats[chatIndex] = ChatModel(
          chatId: current.chatId,
          taskId: current.taskId,
          taskTitle: current.taskTitle,
          taskOwnerUserId: current.taskOwnerUserId,
          taskOwnerName: current.taskOwnerName,
          users: current.users,
          lastMessage: created,
        );
        _state = ViewState<List<ChatModel>>.success(chats);
      }
    } finally {
      _isSendingMessage = false;
      notifyListeners();
    }
  }
}
