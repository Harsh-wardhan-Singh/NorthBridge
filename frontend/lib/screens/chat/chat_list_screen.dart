import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/core/utils/date_time_utils.dart';
import 'package:frontend/models/chat_model.dart';
import 'package:frontend/providers/chat_provider.dart';
import 'package:frontend/routes/app_routes.dart';
import 'package:frontend/widgets/app_button.dart';
import 'package:frontend/widgets/app_card.dart';
import 'package:frontend/widgets/user_name_with_avatar.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({
    super.key,
    required this.chatProvider,
  });

  static const String routeName = '/chat';

  final ChatProvider chatProvider;

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final Set<String> _expandedTaskIds = <String>{};

  void _toggleTask(String taskId) {
    setState(() {
      if (_expandedTaskIds.contains(taskId)) {
        _expandedTaskIds.remove(taskId);
      } else {
        _expandedTaskIds.add(taskId);
      }
    });
  }

  String _offerLabel(ChatModel chat) {
    final offeredBy = chat.users.firstWhere(
      (userId) => userId != chat.taskOwnerUserId,
      orElse: () => chat.users.isNotEmpty ? chat.users.first : 'User',
    );
    return 'Offer from $offeredBy';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chats'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: AnimatedBuilder(
            animation: widget.chatProvider,
            builder: (context, _) {
              final state = widget.chatProvider.state;
              final chats = state.data ?? const [];

              if (state.isLoading && chats.isEmpty) {
                return const Center(child: CircularProgressIndicator());
              }

              if (state.isError && chats.isEmpty) {
                return Center(
                  child: Padding(
                    padding: AppSpacing.screenPadding,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          state.message ?? 'Unable to load chats.',
                          style: theme.textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        AppButton(
                          label: 'Retry',
                          onPressed: widget.chatProvider.loadChats,
                          isFullWidth: false,
                        ),
                      ],
                    ),
                  ),
                );
              }

              if (state.isEmpty || chats.isEmpty) {
                return Center(
                  child: Text(
                    state.message ?? 'No chats yet.',
                    style: theme.textTheme.bodyMedium,
                  ),
                );
              }

              final grouped = <String, List<ChatModel>>{};
              for (final chat in chats) {
                grouped.putIfAbsent(chat.taskId, () => <ChatModel>[]).add(chat);
              }

              final taskGroups = grouped.values.toList()
                ..sort((a, b) {
                  final aTime = a.first.lastMessage.timestamp;
                  final bTime = b.first.lastMessage.timestamp;
                  return bTime.compareTo(aTime);
                });

              return ListView.separated(
                padding: AppSpacing.screenPadding,
                itemCount: taskGroups.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final offers = taskGroups[index];
                  final head = offers.first;
                  final offerCount = offers.length;
                  final isExpanded = _expandedTaskIds.contains(head.taskId);

                  return AppCard(
                    onTap: () => _toggleTask(head.taskId),
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            head.taskTitle,
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.xxs),
                          UserNameWithAvatar(
                            userId: head.taskOwnerUserId,
                            name: head.taskOwnerName,
                            onTap: () => AppRoutes.goToPublicProfile(
                              context,
                              userId: head.taskOwnerUserId,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            '$offerCount offers',
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            'Latest: ${formatChatTime(head.lastMessage.timestamp)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          if (isExpanded) ...[
                            const SizedBox(height: AppSpacing.sm),
                            ...offers.map((offerChat) {
                              return Padding(
                                padding: const EdgeInsets.only(
                                    bottom: AppSpacing.xs),
                                child: OutlinedButton(
                                  onPressed: () => AppRoutes.goToChatThread(
                                    context,
                                    chatModel: offerChat,
                                  ),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(_offerLabel(offerChat)),
                                        ),
                                        const SizedBox(width: AppSpacing.xs),
                                        Text(
                                          formatChatTime(
                                              offerChat.lastMessage.timestamp),
                                          style: theme.textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
