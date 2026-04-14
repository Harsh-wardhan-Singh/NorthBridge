function isPlainObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBody(body) {
	return isPlainObject(body) ? body : {};
}

function readRuleValue(source, key) {
	if (!isPlainObject(source)) {
		return undefined;
	}

	return source[key];
}

function validateField(value, rule) {
	if (rule.required && (value === undefined || value === null || value === '')) {
		return 'is required';
	}

	if (value === undefined || value === null || value === '') {
		return null;
	}

	if (rule.type === 'string' && typeof value !== 'string') {
		return 'must be a string';
	}

	if (rule.type === 'number' && typeof value !== 'number') {
		return 'must be a number';
	}

	if (rule.type === 'boolean' && typeof value !== 'boolean') {
		return 'must be a boolean';
	}

	if (rule.type === 'array' && !Array.isArray(value)) {
		return 'must be an array';
	}

	return null;
}

function validateBody(schema = {}, body = {}) {
	const normalizedBody = normalizeBody(body);
	const errors = [];
	const value = {};

	for (const [key, rule] of Object.entries(schema)) {
		const fieldRule = isPlainObject(rule) ? rule : { type: rule };
		const fieldValue = readRuleValue(normalizedBody, key);
		const validationMessage = validateField(fieldValue, fieldRule);
		if (validationMessage) {
			errors.push({ field: key, message: validationMessage });
			continue;
		}

		if (fieldValue !== undefined) {
			value[key] = fieldValue;
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		value,
	};
}

function validateRequest(schema = {}) {
	return function validateRequestMiddleware(req, res, next) {
		const result = validateBody(schema, req?.body);
		if (!result.valid) {
			const payload = {
				message: 'Validation failed.',
				errors: result.errors,
			};

			if (res && typeof res.status === 'function' && typeof res.json === 'function') {
				return res.status(400).json(payload);
			}

			return {
				status: 400,
				body: payload,
			};
		}

		req.validatedBody = result.value;
		if (typeof next === 'function') {
			next();
		}
		return result;
	};
}

function withValidation(schema, handler) {
	return function validatedHandler(input = {}) {
		const result = validateBody(schema, input);
		if (!result.valid) {
			return {
				ok: false,
				status: 400,
				body: {
					message: 'Validation failed.',
					errors: result.errors,
				},
			};
		}

		return handler(result.value, input);
	};
}

module.exports = {
	isPlainObject,
	normalizeBody,
	validateField,
	validateBody,
	validateRequest,
	withValidation,
};
