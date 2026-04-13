import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/core/utils/date_time_utils.dart';
import 'package:frontend/models/chat_model.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/chat_provider.dart';
import 'package:frontend/routes/app_routes.dart';
import 'package:frontend/widgets/app_button.dart';
import 'package:frontend/widgets/app_card.dart';
import 'package:frontend/widgets/user_name_with_avatar.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({
    super.key,
    required this.chatProvider,
    required this.authProvider,
  });

  static const String routeName = '/chat';

  final ChatProvider chatProvider;
  final AuthProvider authProvider;

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

  String _offerUserId(ChatModel chat) {
    return chat.users.firstWhere(
      (userId) => userId != chat.taskOwnerUserId,
      orElse: () => chat.users.isNotEmpty ? chat.users.first : 'User',
    );
  }

  String _counterpartUserId(ChatModel chat, String currentUserId) {
    return chat.users.firstWhere(
      (userId) => userId != currentUserId,
      orElse: () => chat.taskOwnerUserId,
    );
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
              final isGuest = widget.authProvider.state.data == null;
              if (isGuest) {
                return Padding(
                  padding: AppSpacing.screenPadding,
                  child: AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Login required',
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            'Please login to view conversations.',
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: AppSpacing.md),
                          AppButton(
                            label: 'Open Login / Signup',
                            onPressed: () => AppRoutes.goToAuth(context),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              final state = widget.chatProvider.state;
              final chats = state.data ?? const [];
              final currentUserId = widget.authProvider.state.data?.id;

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

              if (currentUserId == null) {
                return const SizedBox.shrink();
              }

              final ownTaskChats = chats
                  .where((chat) => chat.taskOwnerUserId == currentUserId)
                  .toList(growable: false);
              final acceptedTaskChats = chats
                  .where((chat) => chat.taskOwnerUserId != currentUserId)
                  .toList(growable: false);

              final groupedOwnTasks = <String, List<ChatModel>>{};
              for (final chat in ownTaskChats) {
                groupedOwnTasks
                    .putIfAbsent(chat.taskId, () => <ChatModel>[])
                    .add(chat);
              }

              final ownTaskGroups = groupedOwnTasks.values.toList()
                ..sort((a, b) {
                  final aTime = a.first.lastMessage.timestamp;
                  final bTime = b.first.lastMessage.timestamp;
                  return bTime.compareTo(aTime);
                });

              acceptedTaskChats.sort(
                (a, b) =>
                    b.lastMessage.timestamp.compareTo(a.lastMessage.timestamp),
              );

              return ListView(
                padding: AppSpacing.screenPadding,
                children: [
                  AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            color: theme.colorScheme.error,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: Text(
                              'Do not send explicit or inappropriate images. Report users immediately if they share abusive content.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Own task chats',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          if (ownTaskGroups.isEmpty)
                            Text(
                              'No conversations on your posted tasks.',
                              style: theme.textTheme.bodyMedium,
                            )
                          else
                            ...ownTaskGroups.map((offers) {
                              final head = offers.first;
                              final offerCount = offers.length;
                              final isExpanded =
                                  _expandedTaskIds.contains(head.taskId);
                              return Padding(
                                padding: const EdgeInsets.only(
                                  top: AppSpacing.sm,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    SizedBox(
                                      width: double.infinity,
                                      height: 86,
                                      child: OutlinedButton(
                                        onPressed: () =>
                                            _toggleTask(head.taskId),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              child: Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    head.taskTitle,
                                                    style: theme
                                                        .textTheme.titleMedium,
                                                  ),
                                                  const SizedBox(
                                                    height: AppSpacing.xxs,
                                                  ),
                                                  Text(
                                                    '$offerCount accepted chats',
                                                    style: theme
                                                        .textTheme.bodySmall,
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(
                                                width: AppSpacing.xs),
                                            Text(
                                              formatChatTime(
                                                head.lastMessage.timestamp,
                                              ),
                                              style: theme.textTheme.bodySmall,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    if (isExpanded) ...[
                                      const SizedBox(
                                        height: AppSpacing.sm,
                                      ),
                                      ...offers.map((offerChat) {
                                        final offerUserId =
                                            _offerUserId(offerChat);
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: AppSpacing.xs,
                                          ),
                                          child: OutlinedButton(
                                            onPressed: () =>
                                                AppRoutes.goToChatThread(
                                              context,
                                              chatModel: offerChat,
                                            ),
                                            child: Align(
                                              alignment: Alignment.centerLeft,
                                              child: Row(
                                                children: [
                                                  Expanded(
                                                    child: FutureBuilder(
                                                      future: widget
                                                          .authProvider
                                                          .loadUserById(
                                                              offerUserId),
                                                      builder:
                                                          (context, snapshot) {
                                                        final name = snapshot
                                                                .data?.name ??
                                                            offerUserId;
                                                        return Text(
                                                          'Offer from $name',
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                  const SizedBox(
                                                    width: AppSpacing.xs,
                                                  ),
                                                  Text(
                                                    formatChatTime(
                                                      offerChat.lastMessage
                                                          .timestamp,
                                                    ),
                                                    style: theme
                                                        .textTheme.bodySmall,
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
                              );
                            }),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Accepted task chats',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          if (acceptedTaskChats.isEmpty)
                            Text(
                              'No accepted task conversations yet.',
                              style: theme.textTheme.bodyMedium,
                            )
                          else
                            ...acceptedTaskChats.map((chat) {
                              final counterpartId =
                                  _counterpartUserId(chat, currentUserId);
                              return Padding(
                                padding: const EdgeInsets.only(
                                  top: AppSpacing.sm,
                                ),
                                child: OutlinedButton(
                                  onPressed: () => AppRoutes.goToChatThread(
                                    context,
                                    chatModel: chat,
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: AppSpacing.xs,
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                chat.taskTitle,
                                                style:
                                                    theme.textTheme.titleMedium,
                                              ),
                                              const SizedBox(
                                                height: AppSpacing.xxs,
                                              ),
                                              UserNameWithAvatar(
                                                userId: counterpartId,
                                                name: chat.taskOwnerName,
                                                onTap: () =>
                                                    AppRoutes.goToPublicProfile(
                                                  context,
                                                  userId: counterpartId,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: AppSpacing.xs),
                                        Text(
                                          formatChatTime(
                                            chat.lastMessage.timestamp,
                                          ),
                                          style: theme.textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
