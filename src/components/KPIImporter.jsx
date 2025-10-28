import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const KPIImporter = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls') && 
        !selectedFile.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    processFile(selectedFile);
  };

  const processFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Leer la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          setError('El archivo está vacío');
          return;
        }

        // Validar estructura esperada
        const requiredColumns = ['Perspectiva', 'Objetivo', 'Indicador'];
        const firstRow = jsonData[0];
        const hasRequiredColumns = requiredColumns.every(col => 
          Object.keys(firstRow).some(key => 
            key.toLowerCase().includes(col.toLowerCase())
          )
        );

        if (!hasRequiredColumns) {
          setError('El archivo debe contener las columnas: Perspectiva, Objetivo, Indicador, Valor Actual (opcional), Valor Meta (opcional)');
          return;
        }

        // Procesar y normalizar datos
        const processedData = jsonData.map((row, index) => {
          // Buscar columnas de forma flexible
          const getColumnValue = (possibleNames) => {
            for (const name of possibleNames) {
              const key = Object.keys(row).find(k => 
                k.toLowerCase().includes(name.toLowerCase())
              );
              if (key) return row[key];
            }
            return '';
          };

          return {
            id: `imported-${Date.now()}-${index}`,
            perspectiva: getColumnValue(['Perspectiva', 'Perspective']) || '',
            objetivo: getColumnValue(['Objetivo', 'Objective', 'Goal']) || '',
            indicador: getColumnValue(['Indicador', 'Indicator', 'Metric']) || '',
            valorActual: parseFloat(getColumnValue(['Valor Actual', 'Current Value', 'Actual', 'Current'])) || 0,
            valorMeta: parseFloat(getColumnValue(['Valor Meta', 'Target Value', 'Meta', 'Target', 'Goal'])) || 100,
            unidad: getColumnValue(['Unidad', 'Unit']) || '%',
            autoCalculate: false,
            fechaCreacion: new Date().toISOString(),
            importado: true
          };
        });

        setPreview(processedData);
      } catch (err) {
        setError('Error al procesar el archivo: ' + err.message);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) return;

    setImporting(true);
    setTimeout(() => {
      onImport(preview);
      setImporting(false);
    }, 500);
  };

  const downloadTemplate = () => {
    // Crear plantilla de ejemplo
    const template = [
      {
        'Perspectiva': 'Fans en Redes Sociales',
        'Objetivo': 'Incrementar número de Seguidores en Redes Sociales',
        'Indicador': 'Índice de número de seguidores en redes',
        'Valor Actual': 5000,
        'Valor Meta': 10000,
        'Unidad': 'personas'
      },
      {
        'Perspectiva': 'Fans en Tiendas Digitales',
        'Objetivo': 'Aumentar cantidad de listeners en tiendas digitales',
        'Indicador': 'Índice de Listeners',
        'Valor Actual': 25000,
        'Valor Meta': 50000,
        'Unidad': 'personas'
      },
      {
        'Perspectiva': 'Marca',
        'Objetivo': 'Potencializar el brand awareness',
        'Indicador': 'Índice de seguidores em redes sociales',
        'Valor Actual': 75,
        'Valor Meta': 100,
        'Unidad': '%'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KPIs');
    XLSX.writeFile(wb, 'Plantilla_KPIs.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-xl">Importar KPIs desde Excel/CSV</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Sube un archivo con tus KPIs y visualízalos automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Botón de plantilla */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">¿Primera vez?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Descarga nuestra plantilla de Excel para ver el formato correcto
                </p>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="gap-2 text-sm"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla
                </Button>
              </div>
            </div>
          </div>

          {/* Área de carga */}
          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                file
                  ? 'border-green-500 bg-green-50'
                  : error
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                    <p className="mb-2 text-sm font-medium text-green-700">
                      {file.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-semibold">Click para subir</span> o arrastra el archivo
                    </p>
                    <p className="text-xs text-gray-500">
                      Excel (.xlsx, .xls) o CSV (.csv)
                    </p>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Vista Previa ({preview.length} KPIs encontrados)
              </h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Perspectiva</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Objetivo</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Indicador</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Actual</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Meta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.map((kpi, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Badge variant="outline" className="text-xs">
                            {kpi.perspectiva}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-gray-900">{kpi.objetivo}</td>
                        <td className="px-4 py-2 text-gray-600">{kpi.indicador}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {kpi.valorActual} {kpi.unidad}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {kpi.valorMeta} {kpi.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formato esperado */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-2">Formato del archivo</h4>
            <p className="text-sm text-gray-600 mb-2">
              Tu archivo Excel o CSV debe contener las siguientes columnas:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Perspectiva</strong> (requerido): Ej: "Fans en Redes Sociales"</li>
              <li>• <strong>Objetivo</strong> (requerido): Ej: "Incrementar seguidores"</li>
              <li>• <strong>Indicador</strong> (requerido): Ej: "Índice de seguidores"</li>
              <li>• <strong>Valor Actual</strong> (opcional): Número actual</li>
              <li>• <strong>Valor Meta</strong> (opcional): Número objetivo</li>
              <li>• <strong>Unidad</strong> (opcional): %, personas, unidades, $</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!preview || preview.length === 0 || importing}
              className="flex-1 gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar {preview?.length || 0} KPIs
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPIImporter;
