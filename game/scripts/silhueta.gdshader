shader_type canvas_item;
// Silhueta de uma cor só (usada nos fantasmas do dash): mantém o formato do desenho
// (transparência da textura) e pinta tudo com a cor do modulate do node.

varying vec4 cor_node;

void vertex() {
	cor_node = COLOR;
}

void fragment() {
	COLOR = vec4(cor_node.rgb, texture(TEXTURE, UV).a * cor_node.a);
}
