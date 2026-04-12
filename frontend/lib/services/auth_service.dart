import 'package:frontend/models/user_model.dart';
import 'package:frontend/services/test_data/user_test_data.dart';

class AuthService {
  static List<Map<String, dynamic>> _userStore = userPreviewApiResponse
      .map((user) => Map<String, dynamic>.from(user))
      .toList();
  static final Map<String, String> _credentialStore = {
    'aarav@northbridge.app': 'pass1234',
    'meera@northbridge.app': 'pass1234',
  };

  UserModel? _currentUser;

  Future<UserModel?> getCurrentUser() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    _currentUser ??= userPreviewApiResponse.isEmpty
        ? null
        : UserModel.fromJson(userPreviewApiResponse.first);
    return _currentUser;
  }

  Future<UserModel?> signInMock() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    if (userPreviewApiResponse.isEmpty) {
      _currentUser = null;
      return null;
    }

    _currentUser = UserModel.fromJson(userPreviewApiResponse.first);
    return _currentUser;
  }

  Future<UserModel?> signInWithCredentials({
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 260));

    final normalizedEmail = email.trim().toLowerCase();
    final matchedPassword = _credentialStore[normalizedEmail];
    if (matchedPassword == null || matchedPassword != password) {
      return null;
    }

    final userJson = _userStore.firstWhere(
      (user) => (user['email'] as String?) == normalizedEmail,
      orElse: () => const <String, dynamic>{},
    );
    if (userJson.isEmpty) {
      return null;
    }

    _currentUser = UserModel.fromJson(userJson);
    return _currentUser;
  }

  Future<UserModel> signUpWithCredentials({
    required String name,
    required String location,
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));

    final normalizedEmail = email.trim().toLowerCase();
    if (_credentialStore.containsKey(normalizedEmail)) {
      throw Exception('Email already exists');
    }

    final user = UserModel(
      id: 'u_${DateTime.now().millisecondsSinceEpoch}',
      name: name.trim(),
      rating: 0,
      location: location.trim(),
    );

    _credentialStore[normalizedEmail] = password;
    _userStore = [
      ..._userStore,
      {
        ...user.toJson(),
        'email': normalizedEmail,
      }
    ];
    _currentUser = user;
    return user;
  }

  Future<void> signOutMock() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    _currentUser = null;
  }
}
