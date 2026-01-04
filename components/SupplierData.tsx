import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase'; // Direct import
import React, { useState } from 'react';
import { Supplier, Group, SupplierDocument } from '../types';
import PageHeader from './PageHeader';
import { BuildingIcon, MailIcon, PhoneIcon, UserIcon, LocationMarkerIcon, LockClosedIcon, DollarIcon, FileIcon, CalendarIcon, ShieldCheckIcon } from './icons';

interface SupplierDataProps {
    supplier: Supplier;
    groups: Group[];
    onUpdateSupplier: (supplier: Supplier, files?: Record<string, File | null>) => void;
    mode?: 'admin' | 'supplier';
}

const documentList = [
    'Contrato/Estatuto Social',
    'Cartão CNPJ',
    'CND Municipal',
    'CND Estadual',
    'CND Tributos Federais',
    'CNDT (Trabalhistas)',
    'CRF (FGTS)',
    'Certidão de Falência'
];

const FileInput: React.FC<{
    label: string;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    validityDate: string;
    onDateChange: (date: string) => void;
    showDate?: boolean;
    existingUrl?: string; // To show if there is already a file
}> = ({ label, selectedFile, onFileChange, validityDate, onDateChange, showDate = true, existingUrl }) => (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {existingUrl && !selectedFile && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Documento Atual Vigente</span>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
                <div className="flex items-center">
                    <label className="cursor-pointer px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm w-full sm:w-auto text-center">
                        {selectedFile ? 'Trocar arquivo' : (existingUrl ? 'Substituir arquivo' : 'Escolher arquivo')}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => onFileChange(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    <span className={`ml-3 text-xs truncate flex-1 ${selectedFile ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                        {selectedFile ? selectedFile.name : (existingUrl ? 'Manter arquivo atual' : 'Nenhum arquivo selecionado')}
                    </span>
                </div>
            </div>

            {showDate && (
                <div className="sm:w-40 flex-shrink-0">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            value={validityDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-2 pl-7 ${!validityDate ? 'border-red-300' : 'border-slate-300'}`}
                            title="Data de Validade do Documento"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">Validade <span className="text-red-500">*</span></p>
                </div>
            )}
        </div>
    </div>
);

// Helper to create updates in the background (needs api import we don't have here yet, so passing responsibility or making direct call)
import * as api from '../services/api';
import { SupplierDocumentUpdate } from '../types';

const SupplierData: React.FC<SupplierDataProps> = ({ supplier: initialSupplier, groups, onUpdateSupplier, mode = 'admin' }) => {
    const { error: toastError, success } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [supplier, setSupplier] = useState({
        ...initialSupplier,
        groups: initialSupplier?.groups || [],
        documents: initialSupplier?.documents || []
    });
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [documentDates, setDocumentDates] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Approval Workflow State
    const [pendingUpdates, setPendingUpdates] = useState<SupplierDocumentUpdate[]>([]);

    // Initialize document dates from existing data
    React.useEffect(() => {
        if (initialSupplier?.documents) {
            const dates: Record<string, string> = {};
            initialSupplier.documents.forEach(doc => {
                if (doc.validityDate) {
                    dates[doc.name] = doc.validityDate.split('T')[0]; // Ensure YYYY-MM-DD
                }
            });
            setDocumentDates(dates);
        }
        // Sync supplier state with prop changes
        if (initialSupplier) {
            setSupplier({
                ...initialSupplier,
                groups: initialSupplier.groups || [],
                documents: initialSupplier.documents || []
            });
        }
    }, [initialSupplier]);

    // Fetch Pending Updates if mode is supplier
    React.useEffect(() => {
        if (mode === 'supplier' && initialSupplier?.id) {
            api.fetchSupplierDocumentUpdates(initialSupplier.id)
                .then(updates => setPendingUpdates(updates))
                .catch(err => console.error("Error loading pending updates", err));
        }
    }, [mode, initialSupplier?.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSupplier(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (groupName: string) => {
        setSupplier(prev => {
            const newGroups = prev.groups.includes(groupName)
                ? prev.groups.filter(g => g !== groupName)
                : [...prev.groups, groupName];
            return { ...prev, groups: newGroups };
        });
    };

    const handleFileChange = (docName: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [docName]: file }));
    };

    const handleDateChange = (docName: string, date: string) => {
        setDocumentDates(prev => ({ ...prev, [docName]: date }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // IF MODE == SUPPLIER, we intercept DOCUMENT changes specifically
            if (mode === 'supplier') {
                let updatesCount = 0;
                // Check each document for changes
                for (const docName of documentList) {
                    const newFile = files[docName];
                    const newDate = documentDates[docName];
                    const existingDoc = supplier.documents?.find(d => d.name === docName);

                    // Logic for "Change": File Uploaded OR Date Changed (and date is different from existing)
                    // Note: We need to handle case where no existingDoc too (but user is adding one)
                    const dateChanged = newDate && (!existingDoc || existingDoc.validityDate?.split('T')[0] !== newDate);

                    if (newFile || (dateChanged && existingDoc)) {
                        // Create Update Request
                        let filePath = undefined;
                        let fileName = undefined;

                        // If file selected, upload first (to a temp or final location? For now, final location but unlinked)
                        if (newFile) {
                            // We need to upload file to get path. 
                            // Re-using upload logic from api.updateSupplier roughly?
                            // Since we can't easily reuse the exact internal logic of updateSupplier without refactoring,
                            // we will assume we can't upload here easily without exposing `uploadFile` at API level.
                            // BUT wait, onUpdateSupplier passed from parent calls `api.updateSupplier`. 
                            // We need `api.uploadSupplierDocument`.

                            // Let's assume we can use api.updateSupplier logic but we want to store it in `supplier_document_updates`.
                            // I will add `uploadSupplierDocument` to api exports if needed or inline it if I can access supabase.
                            // Actually, I can't access supabase storage directly here easily without auth context sometimes?
                            // I will assume `api` has `uploadFile` or similar. It doesn't seem to export it.

                            // Workaround: We will use `api.uploadDocument` if it exists.
                            // Looking at `api.ts` (implied knowledge), usually `updateSupplier` handles uploads.
                            // I will cheat and call `api.updateSupplier` with a FAKE supplier object? No that updates the row.

                            // I'll create a new API function `uploadDocumentForRequest` later? 
                            // Or I'll just skip the upload here and assume the backend handles it? No.

                            // BETTER PLAN: Use `api.createDocumentUpdate` but it accepts `file_path`.
                            // I need to upload the file first.
                            // I will add `uploadDocument` to `api.ts`.

                            // For now, I'll pretend `uploadDocument` exists or I'll add it in next step if it fails?
                            // No, I should fix `api.ts` next to expose upload capability.

                            // Let's postpone the actual "File Upload" part of the implementation plan or 
                            // realize I missed "Upload" in `api.ts`.

                            // Quick fix: I will assume I can add `uploadSupplierDocument` to `api.ts`.
                            const path = `suppliers/${supplier.id}/${Date.now()}_${newFile.name}`;
                            const { data, error } = await supabase.storage.from('documents').upload(path, newFile);
                            if (error) throw error;
                            filePath = data.path;
                            fileName = newFile.name;
                        }

                        await api.createDocumentUpdate({
                            supplier_id: supplier.id,
                            document_name: docName,
                            file_path: filePath,
                            file_name: fileName,
                            validity_date: newDate || undefined,
                            supplierName: supplier.name // Optional context
                        });
                        updatesCount++;
                    }
                }

                // If general info changed, we might still want to update it directly? 
                // The user only asked for "document management approval".
                // So: General info -> Direct Update (via onUpdateSupplier). Documents -> Approval.
                // However, onUpdateSupplier usually saves EVERYTHING.
                // We should call onUpdateSupplier ONLY with the rest of the data, and NOT the document changes (unless we want to).
                // But onUpdateSupplier expects the full object.
                // If we pass `files` as empty objects, it won't update documents.
                // So valid strategy: Call `onUpdateSupplier` for general data (with empty files list). 
                // And `createDocumentUpdate` for docs.

                if (updatesCount > 0) {
                    success(`${updatesCount} documento(s) enviado(s) para análise.`);
                    // Refresh pending updates
                    const updates = await api.fetchSupplierDocumentUpdates(supplier.id);
                    setPendingUpdates(updates);
                }

                // Update general info (excluding file uploads from this call)
                // We pass empty files object so it doesn't try to overwrite docs with nulls
                onUpdateSupplier(supplier, {});
                setIsEditing(false);
                return;
            }

            // --- ADMIN MODE (Original Logic) ---

            // Merge dates into supplier.documents logic is handled by backend or we update the object here?
            // api.updateSupplier takes (supplier, files).
            // We need to make sure the supplier object passed has the updated validity dates for *existing* docs if they were changed but no file uploaded.
            // AND for new files, the backend likely needs the date passed somewhere.
            // Usually `updateSupplier` might need the dates in metadata.

            // Let's look at how we pass dates. 
            // In PreRegistration, we constructed a `documents` array.
            // We should do the same here. Update `supplier.documents` with the dates from `documentDates`.

            const updatedDocuments = documentList.map(docName => {
                const existingDoc = supplier.documents?.find(d => d.name === docName);
                const newFile = files[docName];
                const newDate = documentDates[docName];

                if (newFile) {
                    // New file, will be uploaded. 
                    return {
                        name: docName,
                        fileName: newFile.name,
                        validityDate: newDate,
                        storagePath: existingDoc?.storagePath // Keep path if replacing? No, backend will generate new one. But we might need to know ID.
                    };
                } else if (existingDoc) {
                    // Existing doc, maybe date changed
                    return {
                        ...existingDoc,
                        validityDate: newDate || existingDoc.validityDate
                    };
                }
                return null;
            }).filter(Boolean) as SupplierDocument[];

            const updatedSupplier = {
                ...supplier,
                documents: updatedDocuments
            };

            onUpdateSupplier(updatedSupplier, files);
            setIsEditing(false);
        } catch (error: any) {
            console.error(error);
            toastError("Erro ao salvar dados: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSupplier(initialSupplier);
        setFiles({});
        // Reset dates
        if (initialSupplier.documents) {
            const dates: Record<string, string> = {};
            initialSupplier.documents.forEach(doc => {
                if (doc.validityDate) dates[doc.name] = doc.validityDate.split('T')[0];
            });
            setDocumentDates(dates);
        }
        setIsEditing(false);
    }

    if (!supplier) return null;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Meus Dados Cadastrais"
                subtitle="Visualize e atualize as informações da sua empresa."
                showButton={false}
            />

            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200/80">
                {!isEditing ? (
                    <div className="space-y-6">
                        <InfoItem icon={<BuildingIcon />} label="Razão Social" value={supplier.name} />
                        <InfoItem icon={<UserIcon />} label="Responsável" value={supplier.contactPerson} />
                        <InfoItem icon={<span>#</span>} label="CNPJ" value={supplier.cnpj} />
                        <InfoItem icon={<MailIcon />} label="E-mail" value={supplier.email} />
                        <InfoItem icon={<PhoneIcon />} label="Telefone" value={supplier.phone} />
                        <InfoItem icon={<LocationMarkerIcon />} label="Endereço" value={supplier.address} />

                        <div className="border-t border-slate-200 pt-6 mt-6">
                            <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <DollarIcon className="w-5 h-5 text-slate-500" /> Dados Bancários
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem icon={<span>B</span>} label="Banco" value={supplier.bankName || '-'} />
                                <InfoItem icon={<span>Ag</span>} label="Agência" value={supplier.agency || '-'} />
                                <InfoItem icon={<span>CC</span>} label="Conta Corrente" value={supplier.accountNumber || '-'} />
                                <InfoItem icon={<span>PIX</span>} label="Chave PIX" value={supplier.pixKey || '-'} />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">Grupos de Interesse</p>
                            <div className="flex flex-wrap gap-2">
                                {(supplier.groups || []).map(group => (
                                    <span key={group} className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">{group}</span>
                                ))}
                            </div>
                        </div>

                        {supplier.documents && supplier.documents.length > 0 && (
                            <div className="border-t border-slate-200 pt-6 mt-6">
                                <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-slate-500" /> Situação da Documentação
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {(supplier.documents || []).map((doc, idx) => {
                                        const isExempt = doc.name === 'Contrato/Estatuto Social' || doc.name === 'Cartão CNPJ';

                                        // CHECK PENDING UPDATES
                                        const pendingUpdate = pendingUpdates.find(u => u.document_name === doc.name);

                                        let statusColor = 'bg-green-100 border-green-200 text-green-800';
                                        let statusText = 'Válido';

                                        if (pendingUpdate) {
                                            statusColor = 'bg-blue-100 border-blue-200 text-blue-800';
                                            statusText = 'Em Análise de Atualização';
                                        } else if (!isExempt && doc.validityDate) {
                                            const today = new Date();
                                            const validity = new Date(doc.validityDate);
                                            const diffTime = validity.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            if (diffDays < 0) {
                                                statusColor = 'bg-red-100 border-red-200 text-red-800';
                                                statusText = 'Vencido';
                                            } else if (diffDays <= 30) {
                                                statusColor = 'bg-amber-100 border-amber-200 text-amber-800';
                                                statusText = `Vence em ${diffDays} dias`;
                                            }
                                        }

                                        return (
                                            <div key={idx} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center text-sm ${statusColor.replace('bg-', 'bg-opacity-20 ')}`}>
                                                <div className="flex items-center gap-3 mb-2 md:mb-0">
                                                    <div className={`p-2 rounded-full bg-white bg-opacity-50`}>
                                                        <FileIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-base">{doc.name}</p>
                                                        <p className="text-xs opacity-80">{doc.fileName || 'Arquivo enviado'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!isExempt && (
                                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                                            {doc.validityDate ? (
                                                                <span className="flex items-center gap-1">
                                                                    <CalendarIcon className="w-3 h-3" /> {statusText}: {new Date(doc.validityDate).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            ) : (
                                                                <span>{statusText || 'Data não informada'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isExempt && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Sem validade</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-500 mt-2 italic">
                                    Para atualizar documentos vencidos, entre em contato com o Departamento de Contratações ou aguarde a abertura do período de renovação cadastral.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-slate-200/80">
                            <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                                Editar Informações
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Razão Social" name="name" value={supplier.name} onChange={handleInputChange} />
                            <InputField label="Responsável" name="contactPerson" value={supplier.contactPerson} onChange={handleInputChange} />
                            <InputField label="CNPJ (não editável)" name="cnpj" value={supplier.cnpj} disabled />
                            <InputField label="E-mail" name="email" value={supplier.email} onChange={handleInputChange} type="email" />
                            <InputField label="Telefone" name="phone" value={supplier.phone} onChange={handleInputChange} type="tel" />
                            <InputField label="Endereço" name="address" value={supplier.address} onChange={handleInputChange} />
                        </div>

                        <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center mb-4 gap-2">
                                <DollarIcon className="w-5 h-5 text-slate-500" />
                                <legend className="text-md font-semibold text-slate-800">Dados Bancários</legend>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Nome do Banco" name="bankName" value={supplier.bankName || ''} onChange={handleInputChange} />
                                <InputField label="Agência" name="agency" value={supplier.agency || ''} onChange={handleInputChange} />
                                <InputField label="Conta Corrente" name="accountNumber" value={supplier.accountNumber || ''} onChange={handleInputChange} />
                                <InputField label="Chave PIX" name="pixKey" value={supplier.pixKey || ''} onChange={handleInputChange} />
                            </div>
                        </fieldset>

                        <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <legend className="text-md font-semibold text-slate-800">Grupos de Interesse</legend>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {(groups || []).map(group => (
                                    <label key={group.id} className={`flex items-center p-3 border rounded-lg transition-all cursor-pointer ${(supplier.groups || []).includes(group.name) ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-slate-50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={(supplier.groups || []).includes(group.name)}
                                            onChange={() => handleGroupChange(group.name)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-sm font-medium text-slate-600">{group.name}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center mb-4 gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-slate-500" />
                                <legend className="text-md font-semibold text-slate-800">Atualizar Documentação</legend>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {documentList.map(docName => {
                                    const existingDoc = supplier.documents?.find(d => d.name === docName);
                                    const hasExisting = !!existingDoc;
                                    return (
                                        <FileInput
                                            key={docName}
                                            label={docName}
                                            selectedFile={files[docName] || null}
                                            onFileChange={(file) => handleFileChange(docName, file)}
                                            validityDate={documentDates[docName] || ''}
                                            onDateChange={(date) => handleDateChange(docName, date)}
                                            showDate={docName !== 'Contrato/Estatuto Social' && docName !== 'Cartão CNPJ'}
                                            existingUrl={hasExisting ? 'true' : undefined}
                                        />
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200/80">
                            <button onClick={handleCancel} disabled={isLoading} className="px-6 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
                            <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-70 flex items-center">
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Salvando...
                                    </>
                                ) : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div>
        <label className="flex items-center text-sm font-medium text-slate-500">
            <span className="w-5 mr-2 flex justify-center text-slate-400">{icon}</span> {label}
        </label>
        <p className="mt-1 text-md text-slate-800 font-semibold ml-7">{value}</p>
    </div>
);

const InputField: React.FC<{ label: string, name: string, value: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, disabled?: boolean }> = ({ label, name, value, onChange, type = 'text', disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed px-3 py-2"
        />
    </div>
);


export default SupplierData;
