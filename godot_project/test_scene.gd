extends SceneTree

func _init():
	print('--- TESTING SCENE LOAD ---')
	var sc = load('res://scenes/Main.tscn')
	print('Main.tscn load result: ', sc)
	if sc:
		var node = sc.instantiate()
		print('Main instantiated: ', node)
		var bg = node.get_node('GamePanel/TableBackground')
		print('TableBackground texture: ', bg.texture if bg else 'NO BG NODE')
		var deck = node.get_node('GamePanel/TableCenter/DeckPile/DeckTex')
		print('Deck texture: ', deck.texture if deck else 'NO DECK NODE')
		
		# Test safe loading
		var tb_path = 'res://table_board.png'
		print('ResourceLoader exists for table_board: ', ResourceLoader.exists(tb_path))
		var file_exists = FileAccess.file_exists(tb_path)
		print('FileAccess file_exists for table_board: ', file_exists)
		if file_exists:
			var img = Image.load_from_file(ProjectSettings.globalize_path(tb_path))
			print('Image load from file: ', img, ' Size: ', img.get_size() if img else 'FAILED')
	print('--- TEST COMPLETE ---')
	quit()
