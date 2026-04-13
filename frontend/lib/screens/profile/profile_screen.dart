import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/models/user_model.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/routes/app_routes.dart';
import 'package:frontend/widgets/app_button.dart';
import 'package:frontend/widgets/app_card.dart';
import 'package:frontend/widgets/app_text_field.dart';
import 'package:frontend/widgets/user_avatar.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.authProvider,
  });

  static const String routeName = '/profile';

  final AuthProvider authProvider;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const int _maxSkills = 10;

  bool _isEditMode = false;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _skillInputController = TextEditingController();
  final TextEditingController _profileImageController = TextEditingController();
  List<String> _skills = const [];

  @override
  void initState() {
    super.initState();
    _syncFromUser(widget.authProvider.state.data);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _skillInputController.dispose();
    _profileImageController.dispose();
    super.dispose();
  }

  void _syncFromUser(UserModel? user) {
    if (user == null) {
      return;
    }

    _nameController.text = user.name;
    _bioController.text = user.bio;
    _locationController.text = user.location;
    _phoneController.text = user.phoneNumber;
    _emailController.text = user.email;
    _skills = List<String>.from(user.skills);
    _profileImageController.text = user.profileImageUrl;
  }

  void _addSkill() {
    final skill = _skillInputController.text.trim();
    if (skill.isEmpty) {
      return;
    }

    if (_skills.length >= _maxSkills) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 10 skills allowed.')),
      );
      return;
    }

    final exists =
        _skills.any((item) => item.toLowerCase() == skill.toLowerCase());
    if (exists) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Skill already added.')),
      );
      return;
    }

    setState(() {
      _skills = [
        ..._skills,
        skill,
      ];
      _skillInputController.clear();
    });
  }

  Future<void> _save() async {
    final authProvider = widget.authProvider;
    final success = await authProvider.updateProfile(
      name: _nameController.text,
      bio: _bioController.text,
      location: _locationController.text,
      phoneNumber: _phoneController.text,
      email: _emailController.text,
      skills: _skills,
      profileImageUrl: _profileImageController.text,
    );

    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Profile updated.'
              : (authProvider.state.message ?? 'Unable to update profile.'),
        ),
      ),
    );

    if (success) {
      setState(() {
        _isEditMode = false;
      });
    }
  }

  Future<void> _signOut() async {
    await widget.authProvider.signOutMock();

    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Signed out successfully.')),
    );

    Navigator.of(context).pushReplacementNamed(AppRoutes.auth);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: AnimatedBuilder(
              animation: widget.authProvider,
              builder: (context, _) {
                final state = widget.authProvider.state;
                final user = state.data;

                if (state.isLoading && user == null) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (user == null) {
                  return AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('No authenticated user.',
                              style: theme.textTheme.titleMedium),
                          const SizedBox(height: AppSpacing.sm),
                          AppButton(
                            label: 'Open Login / Signup',
                            onPressed: () => AppRoutes.goToAuth(context),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (!_isEditMode) {
                  _syncFromUser(user);
                }

                return SingleChildScrollView(
                  child: AppCard(
                    child: Padding(
                      padding: AppSpacing.cardPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              UserAvatar(
                                name: _nameController.text,
                                imageUrl: _profileImageController.text,
                                radius: 24,
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  _nameController.text,
                                  style: theme.textTheme.titleLarge,
                                ),
                              ),
                              OutlinedButton(
                                onPressed: widget.authProvider.isMutating
                                    ? null
                                    : () {
                                        setState(() {
                                          _isEditMode = !_isEditMode;
                                          if (!_isEditMode) {
                                            _syncFromUser(user);
                                          }
                                        });
                                      },
                                child: Text(_isEditMode ? 'Cancel' : 'Edit'),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          AppTextField(
                            label: 'Profile picture URL',
                            controller: _profileImageController,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Name',
                            controller: _nameController,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Bio',
                            controller: _bioController,
                            maxLines: 3,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Location',
                            controller: _locationController,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Phone number',
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Email address',
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            'Notice: changing this email only updates what others see and does not change authentication credentials.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          AppTextField(
                            label: 'Skills',
                            hintText: 'Add up to 10 skills',
                            controller: _skillInputController,
                            readOnly: !_isEditMode,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          if (_isEditMode)
                            Align(
                              alignment: Alignment.centerLeft,
                              child: OutlinedButton.icon(
                                onPressed: _skills.length >= _maxSkills
                                    ? null
                                    : _addSkill,
                                icon: const Icon(Icons.add),
                                label: Text(
                                    'Add skill (${_skills.length}/$_maxSkills)'),
                              ),
                            ),
                          const SizedBox(height: AppSpacing.xs),
                          Wrap(
                            spacing: AppSpacing.xs,
                            runSpacing: AppSpacing.xs,
                            children: _skills.isEmpty
                                ? [
                                    Chip(
                                      label: Text(
                                        'No skills added',
                                        style: theme.textTheme.bodySmall,
                                      ),
                                    ),
                                  ]
                                : _skills
                                    .map(
                                      (skill) => Chip(
                                        label: Text(skill),
                                        onDeleted: _isEditMode
                                            ? () {
                                                setState(() {
                                                  _skills = _skills
                                                      .where((item) =>
                                                          item != skill)
                                                      .toList(growable: false);
                                                });
                                              }
                                            : null,
                                      ),
                                    )
                                    .toList(growable: false),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          if (_isEditMode)
                            AppButton(
                              label: widget.authProvider.isMutating
                                  ? 'Saving...'
                                  : 'Save profile',
                              onPressed:
                                  widget.authProvider.isMutating ? null : _save,
                            ),
                          if (!_isEditMode) ...[
                            const SizedBox(height: AppSpacing.xs),
                            OutlinedButton(
                              onPressed: widget.authProvider.isMutating
                                  ? null
                                  : _signOut,
                              child: const Text('Sign out'),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
