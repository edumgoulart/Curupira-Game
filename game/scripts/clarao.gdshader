shader_type canvas_item;
// Pisca branco: mistura a cor do desenho com branco, sem perder o formato (a transparência).
// "forca" 0 = desenho normal; 1 = silhueta branca. Usado no golpe (chefes e Curupira).
// Funciona por cima do brilho de aviso (modulate), que antes deixava o pisca avermelhado.

uniform float forca : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	COLOR.rgb = mix(COLOR.rgb, vec3(1.0), forca);
}
