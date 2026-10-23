extends Node

static var _cache: Dictionary = {}

static func get_tex(res_path: String) -> Texture2D:
	if _cache.has(res_path):
		return _cache[res_path]
	
	var tex: Texture2D = null
	if ResourceLoader.exists(res_path):
		tex = load(res_path)
	
	if tex == null:
		var abs_path = ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_path):
			var img = Image.load_from_file(abs_path)
			if img:
				tex = ImageTexture.create_from_image(img)
	
	if tex != null:
		_cache[res_path] = tex
	return tex
