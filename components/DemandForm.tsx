import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Demand, Item, Priority, Group, CatalogItem, DemandStatus, Profile, UserRole, Department, DeliveryLocation } from '../types';
import { DEPARTMENTS, DEADLINE_RULES, addBusinessDays } from '../constants';
import * as api from '../services/api';
import { ShieldCheckIcon, PlusIcon, TrashIcon, XIcon, CalendarIcon, ClockIcon } from './icons';
import { getPriceHistory } from '../utils/priceHistory';
import PriceHistoryModal from './PriceHistoryModal';
import PageHeader from './PageHeader';

interface DemandFormProps {
  editingDraft?: Demand;
  onSubmit: (demand: Omit<Demand, 'id' | 'protocol' | 'status' | 'proposals' | 'questions' | 'winner' | 'decisionDate' | 'homologatedBy' | 'createdAt' | 'group' | 'auditLogs'>, status: DemandStatus) => void;
  onCancel: () => void;
  groups: Group[];
  catalogItems: CatalogItem[];
  userProfile: Profile;
  demands: Demand[];
  departments: Department[];
  deliveryLocations?: DeliveryLocation[];
  onNavigateToDemand?: (demandId: number) => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ editingDraft, onSubmit, onCancel, groups, catalogItems, userProfile, demands, departments, deliveryLocations, onNavigateToDemand }) => {
  const { warning } = useToast();
  const [title, setTitle] = useState(editingDraft?.title || '');
  const [historyItem, setHistoryItem] = useState<{ id: string, name: string } | null>(null);
  const [requestingDepartment, setRequestingDepartment] = useState(editingDraft?.requestingDepartment || '');
  // Contact email fallback to profile, but use initialData if present
  const [contactEmail, setContactEmail] = useState(editingDraft?.contactEmail || '');
  const [sector, setSector] = useState(editingDraft?.sector || '');
  const [type, setType] = useState<'Materiais' | 'Serviços'>(editingDraft?.type as any || 'Materiais');
  const [deliveryLocation, setDeliveryLocation] = useState(editingDraft?.deliveryLocation || '');
  const [priority, setPriority] = useState<Priority>(editingDraft?.priority || Priority.MEDIA);
  const [requestDescription, setRequestDescription] = useState(editingDraft?.requestDescription || '');
  const [justification, setJustification] = useState(editingDraft?.justification || '');

  const [proposalDeadline, setProposalDeadline] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    editingDraft?.items ? Array.from(new Set(editingDraft.items.map(i => i.group_id))) : []
  );

  // Initialize items without IDs for the form state
  const [items, setItems] = useState<Omit<Item, 'id'>[]>(
    editingDraft?.items?.map(i => ({
      description: i.description,
      unit: i.unit,
      quantity: i.quantity,
      group_id: i.group_id,
      catalog_item_id: i.catalog_item_id,
      imagePath: i.imagePath,
      imageUrl: i.imageUrl
    })) || []
  );

  // State for new image uploads (index -> File)
  const [itemImages, setItemImages] = useState<Record<number, File>>({});

  const formRef = useRef<HTMLFormElement>(null);

  const isDepartmentRestricted = userProfile.role === UserRole.SECRETARIA;

  useEffect(() => {
    if (!editingDraft) { // Only apply defaults if NOT editing
      if (isDepartmentRestricted && userProfile.department) {
        setRequestingDepartment(userProfile.department);
      }
      if (userProfile.email) {
        setContactEmail(userProfile.email);
      }
    } else {
      // Even if editing, ensure email is set if missing in draft
      if (!contactEmail && userProfile.email) setContactEmail(userProfile.email);
    }
  }, [userProfile, isDepartmentRestricted, editingDraft]);

  useEffect(() => {
    const now = new Date();
    const rules = DEADLINE_RULES[type][priority];
    if (rules) {
      const propDate = addBusinessDays(now, rules.proposalDays);
      const delDate = addBusinessDays(propDate, rules.deliveryDays);
      setProposalDeadline(propDate.toISOString().split('T')[0]);
      setDeliveryDeadline(delDate.toISOString().split('T')[0]);
    }
  }, [priority, type]);

  // Filter items if type changes
  useEffect(() => {
    const itemType = type === 'Materiais' ? 'Material' : 'Serviço';
    setItems(prev => prev.filter(item => {
      const catalogItem = catalogItems.find(ci => ci.id === item.catalog_item_id);
      return catalogItem?.type === itemType;
    }));
  }, [type, catalogItems]);

  const handleAddItem = (item: CatalogItem, groupId: string) => {
    const newItem: Omit<Item, 'id'> = {
      description: item.name,
      unit: item.unit,
      quantity: 1,
      group_id: groupId,
      catalog_item_id: item.id
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemIndex: number) => {
    setItems(prev => prev.filter((_, index) => index !== itemIndex));
  }

  const handleQuantityChange = (itemIndex: number, quantity: number) => {
    setItems(prev => prev.map((item, index) =>
      index === itemIndex ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  }

  const handleImageChange = (itemIndex: number, file: File | null) => {
    if (file) {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      if (file.size > maxSize) {
        warning('Imagem muito grande. Tamanho máximo: 5MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        warning('Formato não suportado. Use JPG, PNG, WEBP ou GIF');
        return;
      }

      setItemImages(prev => ({ ...prev, [itemIndex]: file }));
    } else {
      setItemImages(prev => {
        const newImages = { ...prev };
        delete newImages[itemIndex];
        return newImages;
      });
    }
  };

  const handleAddGroup = (groupId: string) => {
    if (groupId && !selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(prev => [...prev, groupId]);
    }
  }

  const handleRemoveGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
    setItems(prev => prev.filter(item => item.group_id !== groupId));
  }

  const availableGroups = useMemo(() => {
    const itemTypeLabel = type === 'Materiais' ? 'Material' : 'Serviço';
    const groupDescriptionPrefix = type === 'Materiais' ? 'Materiais' : 'Serviços';

    const groupsWithType = groups.filter(g =>
      g.description.startsWith(groupDescriptionPrefix) ||
      catalogItems.some(item => item.groups.includes(g.id) && item.type === itemTypeLabel)
    );
    return groupsWithType.filter(g => g.isActive && !selectedGroupIds.includes(g.id));
  }, [groups, selectedGroupIds, type, catalogItems]);

  const handleSubmit = async (e: React.FormEvent, status: DemandStatus) => {
    e.preventDefault();
    if (!title.trim() || items.length === 0 || !contactEmail) {
      warning("Preencha todos os campos obrigatórios e adicione pelo menos um item.");
      return;
    }

    // Upload images for items that have them
    const itemsWithImages = await Promise.all(
      items.map(async (item, index) => {
        if (itemImages[index]) {
          try {
            // Use a temporary ID for upload organization
            const tempId = Date.now() + index;
            const imagePath = await api.uploadItemImage(
              itemImages[index],
              tempId,
              tempId
            );
            return {
              ...item,
              imagePath,
              imageUrl: api.getItemImageUrl(imagePath)
            };
          } catch (error) {
            console.error('Error uploading image for item:', item.description, error);
            warning(`Erro ao fazer upload da imagem para: ${item.description}`);
            return item; // Continue without image if upload fails
          }
        }
        return item;
      })
    );

    const finalItems = itemsWithImages.map((item, index) => ({ ...item, id: Date.now() + index }));
    const isAwaitingApproval = status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO;
    const finalProposalDeadline = (status !== DemandStatus.RASCUNHO && !isAwaitingApproval) ? new Date(proposalDeadline + 'T23:59:59').toISOString() : undefined;
    const finalDeliveryDeadline = (status !== DemandStatus.RASCUNHO && !isAwaitingApproval) ? new Date(deliveryDeadline + 'T23:59:59').toISOString() : undefined;

    onSubmit({
      title, requestingDepartment, sector, contactEmail, type, deliveryLocation, priority,
      requestDescription, items: finalItems, justification: priority === Priority.URGENTE ? justification : undefined,
      proposalDeadline: finalProposalDeadline, deadline: finalDeliveryDeadline as any
    }, status);
  };

  const currentRules = DEADLINE_RULES[type][priority];

  return (
    <form ref={formRef} className="space-y-6 animate-fade-in-down">
      <PageHeader title="Registrar Nova Demanda" subtitle="O pedido passará por validação técnica do Almoxarifado antes da cotação." showButton={false} />

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Título / Objeto da Demanda</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3.5 transition-all outline-none font-medium text-slate-700"
              placeholder="Ex: Aquisição de cimento para manutenção de calçadas"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Secretaria Requisitante</label>
            <select
              value={requestingDepartment}
              onChange={e => setRequestingDepartment(e.target.value)}
              disabled={isDepartmentRestricted}
              className={`w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700 ${isDepartmentRestricted ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
              required
            >
              <option value="" disabled>Selecione...</option>
              {departments && departments.length > 0
                ? departments.filter(d => d.active).map(dep => <option key={dep.id} value={dep.name}>{dep.name}</option>)
                : DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)
              }
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Local de Entrega / Prestação</label>
            <input
              type="text"
              list="locations-datalist"
              value={deliveryLocation}
              onChange={e => setDeliveryLocation(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-sm px-4 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700"
              placeholder="Ex: Almoxarifado Central ou Endereço Específico"
              required
            />
            <datalist id="locations-datalist">
              {deliveryLocations && deliveryLocations.filter(l => l.active).map(l => {
                const fullText = l.address ? `${l.name} - ${l.address}` : l.name;
                return <option key={l.id} value={fullText}>{l.name}</option>;
              })}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo da Demanda</label>
            <div className="flex bg-slate-100/50 rounded-xl p-1.5 gap-1.5 border border-slate-200/50">
              {(['Materiais', 'Serviços'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${type === t
                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'} `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
            <div className="flex bg-slate-100/50 rounded-xl p-1.5 gap-1.5 border border-slate-200/50">
              {[Priority.BAIXA, Priority.MEDIA, Priority.URGENTE].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${priority === p
                    ? p === Priority.URGENTE ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-500/20' : 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Detalhada e Especificações Técnicas</label>
          <textarea
            value={requestDescription}
            onChange={e => setRequestDescription(e.target.value)}
            className="w-full rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3.5 min-h-[140px] transition-all outline-none font-medium text-slate-700 leading-relaxed"
            placeholder="Descreva as especificações, marcas de referência, e detalhes importantes..."
            required
          />
        </div>

        {
          priority === Priority.URGENTE && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-red-700 mb-1">Justificativa de Urgência (Exigência Legal)</label>
              <textarea value={justification} onChange={e => setJustification(e.target.value)} className="w-full rounded-xl border-red-200 bg-red-50/30 px-4 py-3 shadow-sm focus:ring-red-500 focus:border-red-500" rows={3} placeholder="Descreva por que esta demanda precisa ser tratada em caráter de urgência..." required />
            </div>
          )
        }

        {
          !isDepartmentRestricted && (
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-600" /> Prazos Automáticos (Baseados na Prioridade)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Limite para Receber Propostas</label>
                  <div className="relative">
                    <input type="date" value={proposalDeadline} readOnly className="w-full rounded-lg border-slate-300 bg-white shadow-sm px-4 py-2.5 cursor-not-allowed font-medium" />
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 absolute right-2 top-2.5 font-bold">{currentRules?.proposalDays} dias úteis</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prazo Final para Entrega / Conclusão</label>
                  <div className="relative">
                    <input type="date" value={deliveryDeadline} readOnly className="w-full rounded-lg border-slate-300 bg-white shadow-sm px-4 py-2.5 cursor-not-allowed font-medium" />
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 absolute right-2 top-2.5 font-bold">{currentRules?.deliveryDays} dias úteis</span>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >

      <div className="border-t border-slate-100 pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Itens e Grupos de Fornecimento</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Adicionar Grupo de Atuação</label>
          <select
            onChange={e => handleAddGroup(e.target.value)}
            value=""
            className="w-full rounded-xl border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-blue-500/10 px-4 py-3.5 transition-all outline-none font-medium text-slate-700"
          >
            <option value="" disabled>Selecione um grupo para liberar os itens...</option>
            {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="space-y-6">
          {selectedGroupIds.map(groupId => {
            const group = groups.find(g => g.id === groupId);
            if (!group) return null;
            const itemType = type === 'Materiais' ? 'Material' : 'Serviço';
            const groupItems = catalogItems.filter(ci => ci.groups.includes(groupId) && ci.type === itemType);
            const addedItemIds = items.filter(i => i.group_id === groupId).map(i => i.catalog_item_id);
            const availableItemsForGroup = groupItems.filter(ci => !addedItemIds.includes(ci.id));

            return (
              <div key={groupId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-b">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2"><div className="w-1.5 h-5 bg-blue-600 rounded-full"></div> {group.name}</h4>
                  <button type="button" onClick={() => handleRemoveGroup(groupId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {items.filter(item => item.group_id === groupId).map((item, idx) => {
                    const history = getPriceHistory(item.description, item.catalog_item_id, demands);
                    const last = history[0];

                    return (
                      <div key={idx} className="flex flex-col gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <div className="flex-grow">
                            <div className="text-sm font-bold text-slate-700">{item.description} <span className="text-xs font-normal text-slate-400">({item.unit})</span></div>
                            {last && (
                              <button
                                type="button"
                                onClick={() => setHistoryItem({ id: item.catalog_item_id as string, name: item.description })}
                                className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <ClockIcon className="w-2.5 h-2.5" />
                                Último Vlr: {last.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </button>
                            )}
                          </div>
                          <div className="w-full sm:w-28 flex items-center gap-2">
                            <label className="text-[10px] text-slate-400 uppercase font-black">Qtd:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleQuantityChange(items.indexOf(item), parseInt(e.target.value))}
                              className="w-full rounded-lg border-slate-200 bg-white px-2 py-1.5 text-center font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none"
                            />
                          </div>
                          <button type="button" onClick={() => handleRemoveItem(items.indexOf(item))} className="text-slate-300 hover:text-red-500"><XIcon className="w-5 h-5" /></button>
                        </div>

                        {/* Image Upload Section */}
                        <div className="border-t border-slate-200 pt-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Imagem de Referência (Opcional)
                          </label>
                          <div className="flex items-center gap-3">
                            {(item.imagePath || itemImages[items.indexOf(item)]) && (
                              <img
                                src={itemImages[items.indexOf(item)]
                                  ? URL.createObjectURL(itemImages[items.indexOf(item)])
                                  : (item.imagePath ? api.getItemImageUrl(item.imagePath) : '')}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded border border-slate-300"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange(items.indexOf(item), e.target.files?.[0] || null)}
                              className="block flex-1 text-xs text-slate-500
                                file:mr-3 file:py-1.5 file:px-3
                                file:rounded-md file:border-0
                                file:text-xs file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 file:cursor-pointer"
                            />
                          </div>
                          {itemImages[items.indexOf(item)] && (
                            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                              ✓ {itemImages[items.indexOf(item)].name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2">
                    <select
                      value=""
                      onChange={e => handleAddItem(availableItemsForGroup.find(i => i.id === e.target.value)!, groupId)}
                      className="w-full rounded-xl border-dashed border-2 border-slate-200 bg-slate-50/50 text-slate-500 text-sm py-2.5 px-4 focus:border-blue-400 focus:bg-white transition-all outline-none cursor-pointer hover:border-blue-300"
                    >
                      <option value="" disabled>+ Selecionar item do catálogo...</option>
                      {availableItemsForGroup.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          {selectedGroupIds.length === 0 && <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">Adicione grupos de fornecimento para selecionar os itens.</div>}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 text-slate-500 font-bold hover:text-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, DemandStatus.RASCUNHO)}
          className="px-6 py-3.5 bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm border border-slate-200"
        >
          Salvar Rascunho
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)}
          className="px-10 py-3.5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-3"
        >
          <ShieldCheckIcon className="w-5 h-5" />
          Enviar para Validação
        </button>
      </div>

      {
        historyItem && (
          <PriceHistoryModal
            isOpen={true}
            onClose={() => setHistoryItem(null)}
            description={historyItem.name}
            catalogItemId={historyItem.id}
            demands={demands}
            onNavigateToDemand={onNavigateToDemand}
          />
        )
      }
    </form>
  );
};

export default DemandForm;
