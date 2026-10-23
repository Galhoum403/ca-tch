extends SceneTree

func _init():
	print('--- TESTING DIRECT IMAGE LOADING ---')
	var paths = [
		'res://table_board.png',
		'res://cards/card_back.png',
		'res://avatars/avatar_player.png',
		'res://avatars/avatar_opponent1.png',
		'res://avatars/avatar_opponent2.png',
		'res://avatars/avatar_opponent3.png'
	]
	for p in paths:
		var global_p = ProjectSettings.globalize_path(p)
		var img = Image.load_from_file(global_p)
		if img != null and not img.is_empty():
			var tex = ImageTexture.create_from_image(img)
			print('SUCCESS: ', p, ' - Size: ', tex.get_size())
		else:
			print('FAILED: ', p)
	print('--- TEST COMPLETE ---')
	quit()
