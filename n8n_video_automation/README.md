# Automatización de Creación de Videos con n8n 🎬

Este directorio contiene todo lo necesario para montar nuestra "fábrica de videos" automatizada mediante n8n.

## Flujo de Trabajo (Workflow)

El flujo está diseñado con la siguiente arquitectura:

1. **Entrada (Webhook / Formulario):** Recibe el tema del video o un guión en crudo.
2. **Generación y Estructuración de Guión (OpenAI / GPT-4o Mini):** 
   - Toma el texto crudo y genera el guión narrativo.
   - Crea descripciones visuales (prompts) para cada escena.
3. **Generación de Audio (ElevenLabs):** Convierte el guión narrativo en un archivo de audio hiperrealista (Text-to-Speech).
4. **Generación de Imágenes/Clips (Replicate / PiAPI):** Genera el contenido visual a partir de los prompts de OpenAI.
5. **Ensamblado y Renderizado (Creatomate):** Fusiona el audio y los visuales, añadiendo subtítulos dinámicos estilo TikTok/Reels/Shorts, y devuelve el `.mp4` final.

## Archivos en este proyecto
- `workflow_video_automatizado.json`: Archivo listo para importar a tu instancia de n8n. Contiene los nodos y la estructura base.

## Próximos Pasos
1. Importar el archivo `.json` en tu n8n.
2. Configurar las credenciales para los nodos (OpenAI, ElevenLabs, Creatomate).
3. Personalizar el prompt inicial para que tenga el "tono" de tu marca.
