# Mensajes

El selector de módulos y todos los módulos actuales incluyen los estilos y el
componente. Para otras páginas, inclúyelos así:

```html
<link rel="stylesheet" href="../../shared/css/styles.css">
<link rel="stylesheet" href="../../shared/css/messages.css">
<script src="../../shared/js/messages.js"></script>
```

Ajusta las rutas según la ubicación de la página. Los mensajes se muestran como
texto, no como HTML. Las opciones `type` (`info`, `success`, `warning` o
`error`) y `title` son opcionales.

```js
await GeoMessages.alert("Los cambios se guardaron.", {type: "success"});

const confirmed = await GeoMessages.confirm("¿Deshabilitar este usuario?", {
    title: "Confirmar acción",
    confirmText: "Deshabilitar",
    cancelText: "Cancelar"
});
if (confirmed) {
    // Realizar la acción.
}

GeoMessages.notify("Datos actualizados.", {type: "success"});
```

`alert` y `confirm` devuelven promesas y se muestran en orden si se solicitan
varios diálogos. `confirm` devuelve `false` al cancelar o pulsar Escape.
`notify` no bloquea la página: desaparece después de 5000 ms por defecto.
Usa `duration` en milisegundos (o `0` para mantenerla hasta cerrarla). Devuelve
una función para cerrarla anticipadamente.
